ALTER TABLE doctors ADD COLUMN IF NOT EXISTS degree TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS aadhaar_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS doctors_aadhaar_hash_unique_idx
  ON doctors(aadhaar_hash)
  WHERE aadhaar_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS doctors_registration_number_unique_idx
  ON doctors(registration_number)
  WHERE registration_number IS NOT NULL;
