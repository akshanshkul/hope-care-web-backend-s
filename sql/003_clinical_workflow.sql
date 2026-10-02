CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, description TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL,
  address TEXT, city_id UUID, verification_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS doctor_hospitals (
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (doctor_id, hospital_id)
);
CREATE TABLE IF NOT EXISTS medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE, recorded_by UUID NOT NULL REFERENCES users(id),
  condition TEXT NOT NULL, details TEXT, diagnosed_on DATE, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES hospitals(id), doctor_id UUID REFERENCES doctors(id),
  department_id UUID REFERENCES departments(id), scheduled_at TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'REQUESTED'
    CHECK (status IN ('REQUESTED','ROUTED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS appointment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  from_status TEXT, to_status TEXT NOT NULL, changed_by UUID NOT NULL REFERENCES users(id),
  note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS medical_history_patient_idx ON medical_history(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS appointments_patient_idx ON appointments(patient_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS appointments_hospital_idx ON appointments(hospital_id, status, scheduled_at);
CREATE INDEX IF NOT EXISTS appointments_doctor_idx ON appointments(doctor_id, status, scheduled_at);
