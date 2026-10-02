CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('MEDICAL_REPORT','PRESCRIPTION','LAB_REPORT','DISCHARGE_SUMMARY','AADHAAR','ADDRESS_PROOF','PROFILE_PHOTO','DOCTOR_CERTIFICATE','OTHER')),
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  storage_provider TEXT NOT NULL DEFAULT 'S3',
  storage_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'TEMPORARY' CHECK (status IN ('TEMPORARY','ATTACHED','VERIFIED','REJECTED','DELETED')),
  is_temporary BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS documents_cleanup_idx ON documents (expires_at) WHERE is_temporary AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS documents_owner_idx ON documents (owner_user_id, created_at DESC);

ALTER TABLE patient_addresses
  ADD COLUMN IF NOT EXISTS public_id UUID UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS address_line_1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line_2 TEXT,
  ADD COLUMN IF NOT EXISTS landmark TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS tehsil TEXT,
  ADD COLUMN IF NOT EXISTS village TEXT,
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS previous_address_id UUID REFERENCES patient_addresses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
UPDATE patient_addresses SET address_line_1 = line1, pincode = postal_code, is_active = is_primary, address_type = CASE WHEN address_type = 'HOME' THEN 'CURRENT' ELSE address_type END WHERE address_line_1 IS NULL;
CREATE INDEX IF NOT EXISTS patient_addresses_history_idx ON patient_addresses(patient_id, address_type, version DESC);
CREATE UNIQUE INDEX IF NOT EXISTS patient_addresses_one_active_type_idx ON patient_addresses(patient_id, address_type) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS address_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address_id UUID NOT NULL REFERENCES patient_addresses(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS address_status_history_idx ON address_status_history(address_id, created_at);

CREATE TABLE IF NOT EXISTS address_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  old_address_id UUID REFERENCES patient_addresses(id) ON DELETE SET NULL,
  new_address_id UUID REFERENCES patient_addresses(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
