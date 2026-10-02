import bcrypt from 'bcryptjs';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const passwordHash = await bcrypt.hash('DemoPatient#2026', 12);
const doctorPasswordHash = await bcrypt.hash('DemoDoctor#2026', 12);
const secondDoctorPasswordHash = await bcrypt.hash('DemoDoctor2#2026', 12);
const hospitalPasswordHash = await bcrypt.hash('DemoHospital#2026', 12);
const cmoPasswordHash = await bcrypt.hash('DemoCmo#2026', 12);

async function roleId(client, name) {
  const result = await client.query('SELECT id FROM roles WHERE name = $1', [name]);
  if (!result.rows[0]) throw new Error(`Role ${name} is missing; run npm run db:migrate first`);
  return result.rows[0].id;
}

async function user(client, email, hash, role) {
  const roleRecord = await roleId(client, role);
  const result = await client.query(
    `INSERT INTO users (public_id, email, password_hash, role, role_id)
     VALUES (gen_random_uuid(), $1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, public_id`,
    [email, hash, role, roleRecord]
  );
  await client.query(
    `INSERT INTO user_roles (user_id, role_id, is_primary)
     VALUES ($1, $2, true)
     ON CONFLICT (user_id, role_id) DO UPDATE SET is_primary = true`,
    [result.rows[0].id, roleRecord]
  );
  return result.rows[0];
}

async function professionalAccount(client, table, email, hash) {
  const result = await client.query(
    `INSERT INTO ${table} (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, public_id`,
    [email, hash]
  );
  return result.rows[0];
}

const client = await pool.connect();
try {
  await client.query('BEGIN');

  const patientUser = await user(client, 'demo.patient@hope-care.test', passwordHash, 'PATIENT');
  const doctorUser = await professionalAccount(client, 'doctor_accounts', 'demo.doctor@hope-care.test', doctorPasswordHash);
  const secondDoctorUser = await professionalAccount(client, 'doctor_accounts', 'demo.doctor2@hope-care.test', secondDoctorPasswordHash);
  const hospitalUser = await professionalAccount(client, 'hospital_accounts', 'demo.hospital@hope-care.test', hospitalPasswordHash);
  const cmoUser = (await client.query(
    `INSERT INTO cmo_accounts (email, password_hash, cmo_type)
     VALUES ('demo.cmo.kasganj@hope-care.test', $1, 'DISTRICT')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [cmoPasswordHash]
  )).rows[0];

  const patient = (await client.query(
    `INSERT INTO patients (user_id, identity_hash, date_of_birth, verification_status)
     VALUES ($1, encode(digest('DEMO-AADHAAR-0001', 'sha256'), 'hex'), '1994-06-15', 'VERIFIED')
     ON CONFLICT (user_id) DO UPDATE SET date_of_birth = EXCLUDED.date_of_birth
     RETURNING id, public_id`,
    [patientUser.id]
  )).rows[0];

  await client.query(
    `UPDATE patients SET first_name = 'Aarav', last_name = 'Sharma', preferred_name = 'Aarav',
       sex_at_birth = 'MALE', blood_group = 'O_POSITIVE', emergency_contact = $2::jsonb,
       verification_status = 'VERIFIED', updated_at = now() WHERE id = $1`,
    [patient.id, JSON.stringify({
      name: 'Meera Sharma',
      phone: '+91-9000000001',
      relation: 'MOTHER'
    })]
  );
  await client.query(
    `UPDATE patients SET phone = '+91-9000000000', alternate_phone = '+91-9000000009',
       profile_image_key = 'demo/patients/aarav-sharma/profile.jpg' WHERE id = $1`,
    [patient.id]
  );

  await client.query(
    `INSERT INTO patient_addresses
      (patient_id, address_type, line1, line2, city, district, state, postal_code, pincode_id, district_id, country, is_primary)
     SELECT $1, 'HOME', '42 Demo Residency', 'Kasganj City', 'Kasganj', 'Kasganj', 'Uttar Pradesh',
       '207123', p.id, d.id, 'IN', true
     FROM pincodes p
     JOIN districts d ON d.id = p.district_id
     WHERE p.code = '207123'
       AND NOT EXISTS (
       SELECT 1 FROM patient_addresses WHERE patient_id = $1 AND is_primary = true
     )`,
    [patient.id]
  );

  const doctor = (await client.query(
    `INSERT INTO doctors
      (account_id, registration_number, specialty, years_experience, verification_status, display_name, first_name, last_name, mobile, profile_image_key, address_line, city, state, postal_code)
     VALUES ($1, 'DEMO-MCI-1001', 'Cardiology', 12, 'VERIFIED', 'Dr. Arjun Mehta', 'Arjun', 'Mehta', '+91-9000000011', 'demo/doctors/arjun-mehta/profile.jpg', 'District Hospital Road', 'Kasganj', 'Uttar Pradesh', '207123')
     ON CONFLICT (account_id) DO UPDATE SET specialty = EXCLUDED.specialty
     RETURNING id`,
    [doctorUser.id]
  )).rows[0];

  const secondDoctor = (await client.query(
    `INSERT INTO doctors
      (account_id, registration_number, specialty, years_experience, verification_status, display_name, first_name, last_name, mobile, profile_image_key, address_line, city, state, postal_code)
     VALUES ($1, 'DEMO-MCI-1002', 'Cardiology', 8, 'VERIFIED', 'Dr. Neha Verma', 'Neha', 'Verma', '+91-9000000012', 'demo/doctors/neha-verma/profile.jpg', 'District Hospital Road', 'Kasganj', 'Uttar Pradesh', '207123')
     ON CONFLICT (account_id) DO UPDATE SET specialty = EXCLUDED.specialty
     RETURNING id`,
    [secondDoctorUser.id]
  )).rows[0];

  const hospital = (await client.query(
    `INSERT INTO hospitals (account_id, name, address, verification_status)
     VALUES ($1, 'Hope-Care Kasganj District Hospital', 'District Hospital Road, Kasganj, Uttar Pradesh 207123', 'VERIFIED')
     ON CONFLICT (account_id) DO UPDATE SET
       name = EXCLUDED.name, address = EXCLUDED.address, verification_status = EXCLUDED.verification_status
     RETURNING id`,
    [hospitalUser.id]
  )).rows[0];
  await client.query(
    `UPDATE hospitals h
     SET jurisdiction_code = 'KASGANJ-207123',
         district_id = (
           SELECT d.id FROM districts d
           JOIN states s ON s.id = d.state_id
           WHERE d.code = 'KASGANJ' AND s.code = 'UP'
         )
     WHERE h.id = $1`,
    [hospital.id]
  );
  await client.query(
    `UPDATE hospitals SET display_name = 'Hope-Care Kasganj District Hospital', phone = '+91-9000000020',
       profile_image_key = 'demo/hospitals/hope-care-kasganj/logo.jpg',
       office_address = 'District Hospital Road, Kasganj, Uttar Pradesh 207123' WHERE id = $1`,
    [hospital.id]
  );

  await client.query(
    `UPDATE cmo_accounts
     SET jurisdiction_code = 'KASGANJ-207123',
         district_id = (
           SELECT d.id FROM districts d
           JOIN states s ON s.id = d.state_id
           WHERE d.code = 'KASGANJ' AND s.code = 'UP'
         ),
         verification_status = 'VERIFIED'
     WHERE id = $1`,
    [cmoUser.id]
  );
  await client.query(
    `UPDATE cmo_accounts SET display_name = 'Kasganj District CMO Office', phone = '+91-9000000003',
       profile_image_key = 'demo/cmo/kasganj/profile.jpg',
       office_address = 'District Health Office, Kasganj, Uttar Pradesh 207123' WHERE id = $1`,
    [cmoUser.id]
  );
  const department = (await client.query(
    `INSERT INTO departments (name, description)
     VALUES ('Cardiology', 'Heart and cardiovascular care')
     ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
     RETURNING id`,
  )).rows[0];

  await client.query(
    `INSERT INTO doctor_hospitals (doctor_id, hospital_id, department_id, active)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (doctor_id, hospital_id) DO UPDATE SET department_id = EXCLUDED.department_id, active = true`,
    [doctor.id, hospital.id, department.id]
  );
  await client.query(
    `INSERT INTO doctor_hospitals (doctor_id, hospital_id, department_id, active)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (doctor_id, hospital_id) DO UPDATE SET department_id = EXCLUDED.department_id, active = true`,
    [secondDoctor.id, hospital.id, department.id]
  );

  await client.query(
    `INSERT INTO patient_hospitals (patient_id, hospital_id, relationship, is_primary)
     VALUES ($1, $2, 'REGISTERED', true)
     ON CONFLICT (patient_id, hospital_id) DO UPDATE SET is_primary = true`,
    [patient.id, hospital.id]
  );

  const appointment = (await client.query(
    `INSERT INTO appointments
      (patient_id, hospital_id, doctor_id, department_id, scheduled_at, reason, status)
     SELECT $1, $2, $3, $4, '2026-10-15T10:00:00+05:30', 'Routine cardiac check-up', 'COMPLETED'
     WHERE NOT EXISTS (
       SELECT 1 FROM appointments WHERE patient_id = $1 AND reason = 'Routine cardiac check-up'
     )
     RETURNING id`,
    [patient.id, hospital.id, doctor.id, department.id]
  )).rows[0];

  const appointmentId = appointment?.id || (await client.query(
    `SELECT id FROM appointments WHERE patient_id = $1 AND reason = 'Routine cardiac check-up' LIMIT 1`,
    [patient.id]
  )).rows[0].id;

  await client.query(
    `INSERT INTO patient_medical_records
      (patient_id, appointment_id, authored_by, record_type, title, clinical_data)
     SELECT $1, $2, $3, 'DIAGNOSIS', 'Mild hypertension',
       '{"summary":"Stable blood pressure under monitoring","blood_pressure":"130/85","follow_up_days":30}'::jsonb
     WHERE NOT EXISTS (
       SELECT 1 FROM patient_medical_records WHERE patient_id = $1 AND title = 'Mild hypertension'
     )`,
    [patient.id, appointmentId, patientUser.id]
  );

  const consultation = (await client.query(
    `INSERT INTO consultations
      (appointment_id, patient_id, doctor_id, summary, clinical_notes, diagnosis, started_at, ended_at)
     VALUES ($1, $2, $3, 'Routine cardiac review', 'Patient stable; continue monitoring.',
       '{"primary":"Mild hypertension"}'::jsonb, '2026-10-15T10:00:00+05:30', '2026-10-15T10:30:00+05:30')
     ON CONFLICT (appointment_id) DO UPDATE SET summary = EXCLUDED.summary
     RETURNING id`,
    [appointmentId, patient.id, doctor.id]
  )).rows[0];

  const prescription = (await client.query(
    `INSERT INTO prescriptions (consultation_id, patient_id, doctor_id, notes)
     SELECT $1, $2, $3, 'Take after food; review in 30 days.'
     WHERE NOT EXISTS (SELECT 1 FROM prescriptions WHERE consultation_id = $1)
     RETURNING id`,
    [consultation.id, patient.id, doctor.id]
  )).rows[0];

  if (prescription) {
    await client.query(
      `INSERT INTO prescription_items
        (prescription_id, medicine_name, dosage, frequency, duration, instructions)
       VALUES ($1, 'Amlodipine', '5 mg', 'Once daily', '30 days', 'Take after breakfast')
       ON CONFLICT DO NOTHING`,
      [prescription.id]
    );
  }

  const test = (await client.query(
    `INSERT INTO medical_tests (patient_id, appointment_id, ordered_by, test_name, status)
     SELECT $1, $2, $3, 'Complete Blood Count', 'COMPLETED'
     WHERE NOT EXISTS (
       SELECT 1 FROM medical_tests WHERE patient_id = $1 AND test_name = 'Complete Blood Count'
     )
     RETURNING id`,
    [patient.id, appointmentId, patientUser.id]
  )).rows[0];

  if (test) {
    await client.query(
      `INSERT INTO medical_test_results (test_id, result_data, reported_by, reported_at)
       VALUES ($1, '{"hemoglobin":"14.2 g/dL","status":"Within normal range"}'::jsonb, $2, now())
       ON CONFLICT (test_id) DO UPDATE SET result_data = EXCLUDED.result_data`,
      [test.id, patientUser.id]
    );
  }

  await client.query('COMMIT');
  console.log(JSON.stringify({
    patientEmail: 'demo.patient@hope-care.test',
    patientPassword: 'DemoPatient#2026',
    patientPublicId: patient.public_id,
    doctorEmail: 'demo.doctor@hope-care.test',
    doctorPassword: 'DemoDoctor#2026',
    secondDoctorEmail: 'demo.doctor2@hope-care.test',
    secondDoctorPassword: 'DemoDoctor2#2026',
    hospitalEmail: 'demo.hospital@hope-care.test',
    hospitalPassword: 'DemoHospital#2026'
    ,cmoEmail: 'demo.cmo.kasganj@hope-care.test'
    ,cmoPassword: 'DemoCmo#2026'
    ,cmoJurisdiction: 'KASGANJ-207123'
  }, null, 2));
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
