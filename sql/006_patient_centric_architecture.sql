-- Multi-role compatibility: role_id remains the legacy primary role while user_roles
-- is the authoritative many-to-many assignment table.
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);
INSERT INTO user_roles (user_id, role_id, is_primary)
SELECT id, role_id, true FROM users
WHERE role_id IS NOT NULL
ON CONFLICT (user_id, role_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_one_primary_idx ON user_roles(user_id) WHERE is_primary;
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles(role_id);

CREATE TABLE IF NOT EXISTS patient_profiles (
  patient_id UUID PRIMARY KEY REFERENCES patients(id) ON DELETE CASCADE,
  first_name TEXT, last_name TEXT, preferred_name TEXT, sex_at_birth TEXT,
  blood_group TEXT, emergency_contact JSONB, verification_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO patient_profiles(patient_id)
SELECT id FROM patients ON CONFLICT (patient_id) DO NOTHING;
INSERT INTO patients (user_id, identity_hash)
SELECT u.id, encode(digest(u.email, 'sha256'), 'hex')
FROM users u JOIN roles r ON r.id=u.role_id
WHERE r.name IN ('PATIENT','DOCTOR')
  AND NOT EXISTS (SELECT 1 FROM patients p WHERE p.user_id=u.id);
INSERT INTO patient_profiles(patient_id)
SELECT p.id FROM patients p
WHERE NOT EXISTS (SELECT 1 FROM patient_profiles pp WHERE pp.patient_id=p.id);
CREATE TABLE IF NOT EXISTS patient_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL DEFAULT 'HOME', line1 TEXT NOT NULL, line2 TEXT, city TEXT,
  state TEXT, postal_code TEXT, country TEXT NOT NULL DEFAULT 'IN', is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS patient_addresses_primary_idx ON patient_addresses(patient_id) WHERE is_primary;
CREATE TABLE IF NOT EXISTS patient_hospitals (
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'REGISTERED', is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (patient_id, hospital_id)
);

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS years_experience INTEGER CHECK (years_experience IS NULL OR years_experience >= 0);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS verification_notes TEXT;

CREATE TABLE IF NOT EXISTS patient_medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  authored_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  record_type TEXT NOT NULL, title TEXT NOT NULL, clinical_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS patient_medical_records_patient_idx ON patient_medical_records(patient_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  summary TEXT, clinical_notes TEXT, diagnosis JSONB, started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  notes TEXT, issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL, dosage TEXT NOT NULL, frequency TEXT NOT NULL, duration TEXT, instructions TEXT
);
CREATE TABLE IF NOT EXISTS medical_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL, ordered_by UUID NOT NULL REFERENCES users(id),
  test_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ORDERED'
    CHECK (status IN ('ORDERED','COLLECTED','COMPLETED','CANCELLED')), ordered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS medical_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), test_id UUID NOT NULL UNIQUE REFERENCES medical_tests(id) ON DELETE CASCADE,
  result_data JSONB NOT NULL, reported_by UUID REFERENCES users(id), reported_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS medical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id), appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE, content_type TEXT, size_bytes BIGINT,
  checksum TEXT, visibility TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (visibility = 'PRIVATE'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS clinical_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), actor_id UUID NOT NULL REFERENCES users(id),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL, resource_type TEXT NOT NULL,
  resource_id TEXT, action TEXT NOT NULL, granted BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clinical_access_audit_patient_idx ON clinical_access_audit(patient_id, created_at DESC);
