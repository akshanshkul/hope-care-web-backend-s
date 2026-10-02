CREATE TABLE IF NOT EXISTS doctor_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  account_status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hospital_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  account_status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS account_id UUID;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT gen_random_uuid();
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS account_id UUID;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT gen_random_uuid();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'doctors' AND column_name = 'user_id'
  ) THEN
    INSERT INTO doctor_accounts (email, password_hash)
    SELECT u.email, u.password_hash
    FROM users u
    JOIN doctors d ON d.user_id = u.id
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
    UPDATE doctors d SET account_id = a.id
    FROM users u JOIN doctor_accounts a ON a.email = u.email
    WHERE d.user_id = u.id AND d.account_id IS NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hospitals' AND column_name = 'user_id'
  ) THEN
    INSERT INTO hospital_accounts (email, password_hash)
    SELECT u.email, u.password_hash
    FROM users u
    JOIN hospitals h ON h.user_id = u.id
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
    UPDATE hospitals h SET account_id = a.id
    FROM users u JOIN hospital_accounts a ON a.email = u.email
    WHERE h.user_id = u.id AND h.account_id IS NULL;
  END IF;
END $$;

ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_user_id_key;
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_user_id_fkey;
ALTER TABLE hospitals DROP CONSTRAINT IF EXISTS hospitals_user_id_key;
ALTER TABLE hospitals DROP CONSTRAINT IF EXISTS hospitals_user_id_fkey;
ALTER TABLE doctors DROP COLUMN IF EXISTS user_id;
ALTER TABLE hospitals DROP COLUMN IF EXISTS user_id;
ALTER TABLE doctors ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE hospitals ALTER COLUMN account_id SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'doctors_account_id_fkey') THEN
    ALTER TABLE doctors ADD CONSTRAINT doctors_account_id_fkey FOREIGN KEY (account_id) REFERENCES doctor_accounts(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hospitals_account_id_fkey') THEN
    ALTER TABLE hospitals ADD CONSTRAINT hospitals_account_id_fkey FOREIGN KEY (account_id) REFERENCES hospital_accounts(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS doctors_account_id_idx ON doctors(account_id);
CREATE UNIQUE INDEX IF NOT EXISTS hospitals_account_id_idx ON hospitals(account_id);
CREATE UNIQUE INDEX IF NOT EXISTS doctors_public_id_idx ON doctors(public_id);
CREATE UNIQUE INDEX IF NOT EXISTS hospitals_public_id_idx ON hospitals(public_id);

ALTER TABLE patient_medical_records DROP CONSTRAINT IF EXISTS patient_medical_records_authored_by_fkey;
ALTER TABLE patient_medical_records ALTER COLUMN authored_by DROP NOT NULL;

DELETE FROM users WHERE role IN ('DOCTOR', 'HOSPITAL');
