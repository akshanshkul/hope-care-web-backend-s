ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role IN (
    'ADMIN', 'NATIONAL_ADMIN', 'DOCTOR', 'PATIENT', 'HOSPITAL', 'STAFF', 'AUDITOR',
    'CMO_DISTRICT', 'CMO_STATE', 'CMO_NOMINEE_AC'
  )
);

CREATE TABLE IF NOT EXISTS national_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  authority_name TEXT NOT NULL DEFAULT 'National Health Authority',
  jurisdiction_code TEXT NOT NULL DEFAULT 'NATIONAL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admins ADD COLUMN IF NOT EXISTS jurisdiction_code TEXT NOT NULL DEFAULT 'GLOBAL';
ALTER TABLE admins ADD COLUMN IF NOT EXISTS admin_scope TEXT NOT NULL DEFAULT 'GLOBAL';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS jurisdiction_code TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS jurisdiction_code TEXT;
CREATE INDEX IF NOT EXISTS hospitals_jurisdiction_idx ON hospitals(jurisdiction_code);
CREATE INDEX IF NOT EXISTS appointments_jurisdiction_idx ON appointments(jurisdiction_code);
