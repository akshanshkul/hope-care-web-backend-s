ALTER TABLE patients ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS mobile TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS patients_identity_hash_unique_idx
  ON patients(identity_hash);
