UPDATE patients
SET public_id = 'PAT' || lpad(substring(public_id FROM 4), 7, '0')
WHERE public_id ~ '^PAT[0-9A-Z]+$';

UPDATE doctors
SET public_id = 'DOC' || lpad(substring(public_id FROM 4), 7, '0')
WHERE public_id ~ '^DOC[0-9A-Z]+$';

UPDATE cmo_accounts
SET public_id = 'CMO' || lpad(substring(public_id FROM 4), 7, '0')
WHERE public_id ~ '^CMO[0-9A-Z]+$';

UPDATE hospitals
SET public_id = 'HOS' || lpad(substring(public_id FROM 4), 7, '0')
WHERE public_id ~ '^HOS[0-9A-Z]+$';

UPDATE doctor_accounts a
SET public_id = d.public_id
FROM doctors d
WHERE d.account_id = a.id;

UPDATE hospital_accounts a
SET public_id = h.public_id
FROM hospitals h
WHERE h.account_id = a.id;

ALTER TABLE patients
  ALTER COLUMN public_id SET DEFAULT ('PAT' || lpad(to_base36(nextval('patient_code_seq')), 7, '0'));
ALTER TABLE doctors
  ALTER COLUMN public_id SET DEFAULT ('DOC' || lpad(to_base36(nextval('doctor_code_seq')), 7, '0'));
ALTER TABLE cmo_accounts
  ALTER COLUMN public_id SET DEFAULT ('CMO' || lpad(to_base36(nextval('cmo_code_seq')), 7, '0'));
ALTER TABLE hospitals
  ALTER COLUMN public_id SET DEFAULT ('HOS' || lpad(to_base36(nextval('hospital_code_seq')), 7, '0'));
ALTER TABLE doctor_accounts
  ALTER COLUMN public_id SET DEFAULT ('DOC' || lpad(to_base36(nextval('doctor_code_seq')), 7, '0'));
ALTER TABLE hospital_accounts
  ALTER COLUMN public_id SET DEFAULT ('HOS' || lpad(to_base36(nextval('hospital_code_seq')), 7, '0'));
