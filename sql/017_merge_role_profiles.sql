ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS preferred_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
  ADD COLUMN IF NOT EXISTS profile_image_key TEXT,
  ADD COLUMN IF NOT EXISTS sex_at_birth TEXT,
  ADD COLUMN IF NOT EXISTS blood_group TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact JSONB;

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS mobile TEXT,
  ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
  ADD COLUMN IF NOT EXISTS profile_image_key TEXT,
  ADD COLUMN IF NOT EXISTS address_line TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT;

ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
  ADD COLUMN IF NOT EXISTS profile_image_key TEXT,
  ADD COLUMN IF NOT EXISTS office_address TEXT;

ALTER TABLE cmo_accounts
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
  ADD COLUMN IF NOT EXISTS profile_image_key TEXT,
  ADD COLUMN IF NOT EXISTS office_address TEXT;

DO $$
BEGIN
  IF to_regclass('patient_profiles') IS NOT NULL THEN
    UPDATE patients p SET first_name = COALESCE(p.first_name, pp.first_name), last_name = COALESCE(p.last_name, pp.last_name),
      preferred_name = COALESCE(p.preferred_name, pp.preferred_name), phone = COALESCE(p.phone, pp.phone),
      alternate_phone = COALESCE(p.alternate_phone, pp.alternate_phone), profile_image_key = COALESCE(p.profile_image_key, pp.profile_image_key),
      sex_at_birth = COALESCE(p.sex_at_birth, pp.sex_at_birth), blood_group = COALESCE(p.blood_group, pp.blood_group),
      emergency_contact = COALESCE(p.emergency_contact, pp.emergency_contact)
    FROM patient_profiles pp WHERE pp.patient_id = p.id;
  END IF;
  IF to_regclass('doctor_profiles') IS NOT NULL THEN
    UPDATE doctors d SET display_name = COALESCE(d.display_name, dp.display_name),
      first_name = COALESCE(d.first_name, split_part(dp.display_name, ' ', 2)),
      last_name = COALESCE(d.last_name, NULLIF(regexp_replace(dp.display_name, '^\\S+\\s*', ''), '')),
      mobile = COALESCE(d.mobile, dp.phone), alternate_phone = COALESCE(d.alternate_phone, dp.alternate_phone),
      profile_image_key = COALESCE(d.profile_image_key, dp.profile_image_key), address_line = COALESCE(d.address_line, dp.address_line),
      city = COALESCE(d.city, dp.city), state = COALESCE(d.state, dp.state), postal_code = COALESCE(d.postal_code, dp.postal_code)
    FROM doctor_profiles dp WHERE dp.doctor_account_id = d.account_id;
  END IF;
  IF to_regclass('hospital_profiles') IS NOT NULL THEN
    UPDATE hospitals h SET display_name = COALESCE(h.display_name, hp.display_name), phone = COALESCE(h.phone, hp.phone),
      alternate_phone = COALESCE(h.alternate_phone, hp.alternate_phone), profile_image_key = COALESCE(h.profile_image_key, hp.profile_image_key),
      office_address = COALESCE(h.office_address, hp.office_address)
    FROM hospital_profiles hp WHERE hp.hospital_account_id = h.account_id;
  END IF;
  IF to_regclass('cmo_profiles') IS NOT NULL THEN
    UPDATE cmo_accounts c SET display_name = COALESCE(c.display_name, cp.display_name), phone = COALESCE(c.phone, cp.phone),
      alternate_phone = COALESCE(c.alternate_phone, cp.alternate_phone), profile_image_key = COALESCE(c.profile_image_key, cp.profile_image_key),
      office_address = COALESCE(c.office_address, cp.office_address)
    FROM cmo_profiles cp WHERE cp.cmo_account_id = c.id;
  END IF;
END $$;

DROP TABLE IF EXISTS patient_profiles;
DROP TABLE IF EXISTS doctor_profiles;
DROP TABLE IF EXISTS hospital_profiles;
DROP TABLE IF EXISTS cmo_profiles;
DROP TABLE IF EXISTS user_profiles;
