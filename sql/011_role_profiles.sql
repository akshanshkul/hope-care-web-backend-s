ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS alternate_phone TEXT;
ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS profile_image_key TEXT;

CREATE TABLE IF NOT EXISTS doctor_profiles (
  doctor_account_id UUID PRIMARY KEY REFERENCES doctor_accounts(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  alternate_phone TEXT,
  profile_image_key TEXT,
  address_line TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cmo_profiles (
  cmo_account_id UUID PRIMARY KEY REFERENCES cmo_accounts(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  alternate_phone TEXT,
  profile_image_key TEXT,
  office_address TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hospital_profiles (
  hospital_account_id UUID PRIMARY KEY REFERENCES hospital_accounts(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  alternate_phone TEXT,
  profile_image_key TEXT,
  office_address TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
