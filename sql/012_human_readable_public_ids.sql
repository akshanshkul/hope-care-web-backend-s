CREATE SEQUENCE IF NOT EXISTS patient_code_seq;
CREATE SEQUENCE IF NOT EXISTS doctor_code_seq;
CREATE SEQUENCE IF NOT EXISTS cmo_code_seq;
CREATE SEQUENCE IF NOT EXISTS hospital_code_seq;

ALTER TABLE patients ALTER COLUMN public_id TYPE TEXT USING public_id::text;
ALTER TABLE doctors ALTER COLUMN public_id TYPE TEXT USING public_id::text;
ALTER TABLE cmo_accounts ALTER COLUMN public_id TYPE TEXT USING public_id::text;
ALTER TABLE hospitals ALTER COLUMN public_id TYPE TEXT USING public_id::text;
ALTER TABLE doctor_accounts ALTER COLUMN public_id TYPE TEXT USING public_id::text;
ALTER TABLE hospital_accounts ALTER COLUMN public_id TYPE TEXT USING public_id::text;

UPDATE patients
SET public_id = 'P' || lpad(nextval('patient_code_seq')::text, 6, '0')
WHERE public_id IS NULL OR public_id !~ '^P[0-9]{6,}$';

UPDATE doctors
SET public_id = 'D' || lpad(nextval('doctor_code_seq')::text, 6, '0')
WHERE public_id IS NULL OR public_id !~ '^D[0-9]{6,}$';

UPDATE cmo_accounts
SET public_id = 'CMO' || lpad(nextval('cmo_code_seq')::text, 6, '0')
WHERE public_id IS NULL OR public_id !~ '^CMO[0-9]{6,}$';

UPDATE hospitals
SET public_id = 'H' || lpad(nextval('hospital_code_seq')::text, 6, '0')
WHERE public_id IS NULL OR public_id !~ '^H[0-9]{6,}$';

UPDATE doctor_accounts a
SET public_id = d.public_id
FROM doctors d
WHERE d.account_id = a.id;

UPDATE hospital_accounts a
SET public_id = h.public_id
FROM hospitals h
WHERE h.account_id = a.id;

SELECT setval('patient_code_seq', GREATEST(COALESCE((SELECT MAX(substring(public_id FROM 2)::bigint) FROM patients WHERE public_id ~ '^P[0-9]+$'), 0), 1), true);
SELECT setval('doctor_code_seq', GREATEST(COALESCE((SELECT MAX(substring(public_id FROM 2)::bigint) FROM doctors WHERE public_id ~ '^D[0-9]+$'), 0), 1), true);
SELECT setval('cmo_code_seq', GREATEST(COALESCE((SELECT MAX(substring(public_id FROM 4)::bigint) FROM cmo_accounts WHERE public_id ~ '^CMO[0-9]+$'), 0), 1), true);
SELECT setval('hospital_code_seq', GREATEST(COALESCE((SELECT MAX(substring(public_id FROM 2)::bigint) FROM hospitals WHERE public_id ~ '^H[0-9]+$'), 0), 1), true);

ALTER TABLE patients ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE doctors ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE cmo_accounts ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE hospitals ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE doctor_accounts ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE hospital_accounts ALTER COLUMN public_id SET NOT NULL;

ALTER TABLE patients ALTER COLUMN public_id SET DEFAULT ('P' || lpad(nextval('patient_code_seq')::text, 6, '0'));
ALTER TABLE doctors ALTER COLUMN public_id SET DEFAULT ('D' || lpad(nextval('doctor_code_seq')::text, 6, '0'));
ALTER TABLE cmo_accounts ALTER COLUMN public_id SET DEFAULT ('CMO' || lpad(nextval('cmo_code_seq')::text, 6, '0'));
ALTER TABLE hospitals ALTER COLUMN public_id SET DEFAULT ('H' || lpad(nextval('hospital_code_seq')::text, 6, '0'));
ALTER TABLE doctor_accounts ALTER COLUMN public_id SET DEFAULT ('D' || lpad(nextval('doctor_code_seq')::text, 6, '0'));
ALTER TABLE hospital_accounts ALTER COLUMN public_id SET DEFAULT ('H' || lpad(nextval('hospital_code_seq')::text, 6, '0'));
