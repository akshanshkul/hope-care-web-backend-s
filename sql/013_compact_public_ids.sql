CREATE OR REPLACE FUNCTION to_base36(value BIGINT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  alphabet CONSTANT TEXT := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  result TEXT := '';
  remainder INTEGER;
  current_value BIGINT := value;
BEGIN
  IF current_value < 0 THEN
    RAISE EXCEPTION 'base36 value cannot be negative';
  END IF;
  IF current_value = 0 THEN
    RETURN '0';
  END IF;
  WHILE current_value > 0 LOOP
    remainder := (current_value % 36)::INTEGER;
    result := substr(alphabet, remainder + 1, 1) || result;
    current_value := current_value / 36;
  END LOOP;
  RETURN result;
END;
$$;

UPDATE patients
SET public_id = 'PAT' || lpad(to_base36(substring(public_id FROM 2)::BIGINT), 6, '0')
WHERE public_id ~ '^P[0-9]+$';

UPDATE doctors
SET public_id = 'DOC' || lpad(to_base36(substring(public_id FROM 2)::BIGINT), 6, '0')
WHERE public_id ~ '^D[0-9]+$';

UPDATE cmo_accounts
SET public_id = 'CMO' || lpad(to_base36(substring(public_id FROM 4)::BIGINT), 6, '0')
WHERE public_id ~ '^CMO[0-9]+$';

UPDATE hospitals
SET public_id = 'HOS' || lpad(to_base36(substring(public_id FROM 2)::BIGINT), 6, '0')
WHERE public_id ~ '^H[0-9]+$';

UPDATE doctor_accounts a
SET public_id = d.public_id
FROM doctors d
WHERE d.account_id = a.id;

UPDATE hospital_accounts a
SET public_id = h.public_id
FROM hospitals h
WHERE h.account_id = a.id;

ALTER TABLE patients
  ALTER COLUMN public_id SET DEFAULT ('PAT' || lpad(to_base36(nextval('patient_code_seq')), 6, '0'));
ALTER TABLE doctors
  ALTER COLUMN public_id SET DEFAULT ('DOC' || lpad(to_base36(nextval('doctor_code_seq')), 6, '0'));
ALTER TABLE cmo_accounts
  ALTER COLUMN public_id SET DEFAULT ('CMO' || lpad(to_base36(nextval('cmo_code_seq')), 6, '0'));
ALTER TABLE hospitals
  ALTER COLUMN public_id SET DEFAULT ('HOS' || lpad(to_base36(nextval('hospital_code_seq')), 6, '0'));
ALTER TABLE doctor_accounts
  ALTER COLUMN public_id SET DEFAULT ('DOC' || lpad(to_base36(nextval('doctor_code_seq')), 6, '0'));
ALTER TABLE hospital_accounts
  ALTER COLUMN public_id SET DEFAULT ('HOS' || lpad(to_base36(nextval('hospital_code_seq')), 6, '0'));
