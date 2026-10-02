CREATE TABLE IF NOT EXISTS cmo_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  cmo_type TEXT NOT NULL CHECK (cmo_type IN ('DISTRICT', 'STATE', 'NOMINEE_AC')),
  jurisdiction_code TEXT,
  district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
  verification_status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cmo_accounts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE cmo_accounts ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE cmo_accounts ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT gen_random_uuid();
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'cmo_accounts' AND column_name = 'user_id'
  ) THEN
    UPDATE cmo_accounts c
    SET email = u.email, password_hash = u.password_hash
    FROM users u
    WHERE c.user_id = u.id AND c.email IS NULL;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'cmo_accounts' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE cmo_accounts ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;
ALTER TABLE cmo_accounts ALTER COLUMN email SET NOT NULL;
ALTER TABLE cmo_accounts ALTER COLUMN password_hash SET NOT NULL;
ALTER TABLE cmo_accounts DROP CONSTRAINT IF EXISTS cmo_accounts_user_id_key;
ALTER TABLE cmo_accounts DROP CONSTRAINT IF EXISTS cmo_accounts_user_id_fkey;
ALTER TABLE cmo_accounts DROP COLUMN IF EXISTS user_id;
CREATE UNIQUE INDEX IF NOT EXISTS cmo_accounts_email_idx ON cmo_accounts(email);
CREATE UNIQUE INDEX IF NOT EXISTS cmo_accounts_public_id_idx ON cmo_accounts(public_id);
