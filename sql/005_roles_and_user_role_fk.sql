CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (name IN (
    'PATIENT', 'DOCTOR', 'HOSPITAL', 'CMO_DISTRICT', 'CMO_STATE',
    'CMO_NOMINEE_AC', 'ADMIN', 'NATIONAL_ADMIN', 'STAFF', 'AUDITOR'
  )),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO roles (name, description) VALUES
  ('PATIENT', 'Patient account'),
  ('DOCTOR', 'Doctor account'),
  ('HOSPITAL', 'Hospital account'),
  ('CMO_DISTRICT', 'District chief medical officer'),
  ('CMO_STATE', 'State chief medical officer'),
  ('CMO_NOMINEE_AC', 'Nominee AC chief medical officer'),
  ('ADMIN', 'Scoped platform administrator'),
  ('NATIONAL_ADMIN', 'National health authority administrator'),
  ('STAFF', 'Operational staff account'),
  ('AUDITOR', 'Read-only audit account')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID;
UPDATE users u SET role_id = r.id FROM roles r WHERE r.name = u.role AND u.role_id IS NULL;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_id_fkey;
ALTER TABLE users ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id);
ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS users_role_id_idx ON users(role_id);
