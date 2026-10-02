CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE (country_id, code),
  UNIQUE (country_id, name)
);

CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID NOT NULL REFERENCES states(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE (state_id, code),
  UNIQUE (state_id, name)
);

CREATE TABLE IF NOT EXISTS pincodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
  code CHAR(6) NOT NULL UNIQUE,
  locality TEXT,
  UNIQUE (district_id, code)
);

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES districts(id) ON DELETE SET NULL;
ALTER TABLE cmo_accounts ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES districts(id) ON DELETE SET NULL;
ALTER TABLE patient_addresses ADD COLUMN IF NOT EXISTS pincode_id UUID REFERENCES pincodes(id) ON DELETE SET NULL;
ALTER TABLE patient_addresses ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES districts(id) ON DELETE SET NULL;
ALTER TABLE patient_addresses ADD COLUMN IF NOT EXISTS district TEXT;

INSERT INTO countries (code, name)
VALUES ('IN', 'India')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO states (country_id, code, name)
SELECT c.id, 'UP', 'Uttar Pradesh'
FROM countries c WHERE c.code = 'IN'
ON CONFLICT (country_id, code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO districts (state_id, code, name)
SELECT s.id, 'KASGANJ', 'Kasganj'
FROM states s
JOIN countries c ON c.id = s.country_id
WHERE c.code = 'IN' AND s.code = 'UP'
ON CONFLICT (state_id, code) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO pincodes (district_id, code, locality)
SELECT d.id, '207123', 'Kasganj District'
FROM districts d
JOIN states s ON s.id = d.state_id
JOIN countries c ON c.id = s.country_id
WHERE c.code = 'IN' AND s.code = 'UP' AND d.code = 'KASGANJ'
ON CONFLICT (code) DO UPDATE SET district_id = EXCLUDED.district_id, locality = EXCLUDED.locality;

UPDATE hospitals h
SET district_id = d.id
FROM districts d
JOIN states s ON s.id = d.state_id
WHERE h.jurisdiction_code = 'KASGANJ-207123'
  AND d.code = 'KASGANJ' AND s.code = 'UP';

UPDATE cmo_accounts cmo
SET district_id = d.id
FROM districts d
JOIN states s ON s.id = d.state_id
WHERE cmo.jurisdiction_code = 'KASGANJ-207123'
  AND d.code = 'KASGANJ' AND s.code = 'UP';

CREATE INDEX IF NOT EXISTS hospitals_district_idx ON hospitals(district_id);
CREATE INDEX IF NOT EXISTS cmo_accounts_district_idx ON cmo_accounts(district_id);
CREATE INDEX IF NOT EXISTS pincodes_district_idx ON pincodes(district_id);
