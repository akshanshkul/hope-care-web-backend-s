import { query } from '../db/client';

export const clinicalModel = {
  async patientForUser(userId: string) { return (await query(`SELECT id, public_id FROM patients WHERE user_id=$1`, [userId]))[0]; },
  async doctorForUser(userId: string) { return (await query(`SELECT id FROM doctors WHERE account_id=$1`, [userId]))[0]; },
  async hospitalForUser(userId: string) { return (await query(`SELECT id, public_id, name, address, city_id, verification_status FROM hospitals WHERE account_id=$1`, [userId]))[0]; },
  async history(patientId: string) { return query(`SELECT public_id, condition, details, diagnosed_on, recorded_by, created_at FROM medical_history WHERE patient_id=$1 ORDER BY created_at DESC`, [patientId]); },
  async addHistory(patientId: string, userId: string, x: any) { return (await query(`INSERT INTO medical_history(patient_id,recorded_by,condition,details,diagnosed_on) VALUES($1,$2,$3,$4,$5) RETURNING public_id,condition,details,diagnosed_on,created_at`, [patientId,userId,x.condition,x.details||null,x.diagnosedOn||null]))[0]; },
  async departments() { return query(`SELECT public_id,name,description FROM departments ORDER BY name`, []); },
  async addDepartment(x: any) { return (await query(`INSERT INTO departments(name,description) VALUES($1,$2) RETURNING public_id,name,description`, [x.name,x.description||null]))[0]; },
  async hospitals() {
    return query(`
      SELECT h.public_id,
             h.name,
             h.address,
             jsonb_build_object(
               'line1', h.address_line_1,
               'line2', h.address_line_2,
               'landmark', h.landmark,
               'district', h.district,
               'state', h.state,
               'pincode', h.pincode,
               'country', h.country,
               'cityId', h.city_id,
               'latitude', h.latitude,
               'longitude', h.longitude
             ) AS "addressDetails",
             h.phone,
             h.email,
             h.website,
             h.emergency_phone,
             h.description,
             h.verification_status,
             COALESCE(
               jsonb_agg(DISTINCT jsonb_build_object(
                 'departmentId', dep.public_id,
                 'name', dep.name,
                 'description', dep.description
               )) FILTER (WHERE dep.id IS NOT NULL),
               '[]'::jsonb
             ) AS departments
      FROM hospitals h
      LEFT JOIN doctor_hospitals dh ON dh.hospital_id = h.id AND dh.active
      LEFT JOIN departments dep ON dep.id = dh.department_id
      GROUP BY h.id
      ORDER BY h.name
    `, []);
  },
  async addHospital(userId: string, x: any) {
    return (await query(`
      INSERT INTO hospitals(
        account_id, name, address, address_line_1, address_line_2, landmark,
        district, state, pincode, country, city_id, phone, email, website,
        emergency_phone, description, latitude, longitude
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, 'India'),
        $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING public_id,name,address,address_line_1,address_line_2,landmark,
        district,state,pincode,country,city_id,phone,email,website,
        emergency_phone,description,latitude,longitude,verification_status
    `, [
      userId,
      x.name,
      x.address || x.addressLine1 || null,
      x.addressLine1 || x.address || null,
      x.addressLine2 || null,
      x.landmark || null,
      x.district || null,
      x.state || null,
      x.pincode || null,
      x.country || null,
      x.cityId || null,
      x.phone || null,
      x.email || null,
      x.website || null,
      x.emergencyPhone || null,
      x.description || null,
      x.latitude ?? null,
      x.longitude ?? null
    ]))[0];
  },
  async associate(userId: string, x: any) {
    return (await query(`
      INSERT INTO doctor_hospitals(doctor_id,hospital_id,department_id)
      SELECT d.id,h.id,dep.id
      FROM doctors d
      JOIN hospitals h ON h.account_id=$1
      LEFT JOIN departments dep ON dep.public_id=$3::uuid
      WHERE d.public_id=$2::text
        AND d.verification_status='VERIFIED'
        AND ($3::uuid IS NULL OR dep.id IS NOT NULL)
      ON CONFLICT (doctor_id,hospital_id)
      DO UPDATE SET department_id=EXCLUDED.department_id,active=true
      RETURNING doctor_id, hospital_id, department_id, active
    `, [userId, x.doctorId, x.departmentId || null]))[0];
  },
  async appointment(id: string) { return (await query(`SELECT a.*, p.user_id patient_user_id, h.user_id hospital_user_id, d.user_id doctor_user_id FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN hospitals h ON h.id=a.hospital_id LEFT JOIN doctors d ON d.id=a.doctor_id WHERE a.public_id=$1`, [id]))[0]; },
  async book(userId: string, x: any) {
    return (await query(`INSERT INTO appointments(patient_id,hospital_id,doctor_id,department_id,scheduled_at,reason) SELECT p.id,h.id,d.id,dep.id,$4,$5 FROM patients p JOIN hospitals h ON h.public_id=$2::uuid LEFT JOIN doctors d ON d.id=$3::uuid LEFT JOIN departments dep ON dep.public_id=$6::uuid WHERE p.user_id=$1 AND ($3::uuid IS NULL OR d.id IS NOT NULL) AND ($6::uuid IS NULL OR dep.id IS NOT NULL) AND ($3::uuid IS NULL OR EXISTS(SELECT 1 FROM doctor_hospitals dh WHERE dh.doctor_id=d.id AND dh.hospital_id=h.id AND dh.active AND ($6::uuid IS NULL OR dh.department_id=dep.id))) RETURNING public_id,scheduled_at,reason,status,created_at`, [userId,x.hospitalId,x.doctorId||null,x.scheduledAt,x.reason,x.departmentId||null]))[0];
  },
  async listFor(userId: string, role: string) {
    const field = role === 'PATIENT' ? 'p.user_id' : role === 'DOCTOR' ? 'd.user_id' : 'h.user_id';
    const where = role === 'ADMIN' || role === 'NATIONAL_ADMIN' || role === 'STAFF' ? 'TRUE' : `${field}=$1`;
    return query(`SELECT a.public_id,a.scheduled_at,a.reason,a.status,h.public_id hospital_id,h.name hospital_name,d.id doctor_id,dep.name department_name FROM appointments a JOIN patients p ON p.id=a.patient_id JOIN hospitals h ON h.id=a.hospital_id LEFT JOIN doctors d ON d.id=a.doctor_id LEFT JOIN departments dep ON dep.id=a.department_id WHERE ${where} ORDER BY a.scheduled_at DESC`, (where === 'TRUE' ? [] : [userId]));
  },
  async route(id: string, userId: string, doctorUserId: string, departmentId?: string) {
    return (await query(`UPDATE appointments a SET doctor_id=d.id, department_id=COALESCE(dep.id,a.department_id), status='ROUTED', updated_at=now() FROM hospitals h, doctors d LEFT JOIN departments dep ON dep.public_id=$4::uuid WHERE a.public_id=$1 AND h.id=a.hospital_id AND h.user_id=$2 AND d.user_id=$3 AND EXISTS(SELECT 1 FROM doctor_hospitals dh WHERE dh.doctor_id=d.id AND dh.hospital_id=h.id AND dh.active AND ($4::uuid IS NULL OR dh.department_id=dep.id)) RETURNING a.*`, [id,userId,doctorUserId,departmentId||null]))[0];
  },
  async transition(id: string, userId: string, role: string, status: string, note?: string) {
    const a = await this.appointment(id); if (!a) return undefined;
    const owner = role === 'PATIENT' ? a.patient_user_id === userId : role === 'DOCTOR' ? a.doctor_user_id === userId : role === 'HOSPITAL' ? a.hospital_user_id === userId : true;
    if (!owner) return null;
    const allowed: Record<string,string[]> = { REQUESTED:['CANCELLED'], ROUTED:['CONFIRMED','REJECTED','CANCELLED'], CONFIRMED:['IN_PROGRESS','CANCELLED'], IN_PROGRESS:['COMPLETED'] };
    if (!allowed[a.status]?.includes(status)) throw Object.assign(new Error(`Invalid transition from ${a.status} to ${status}`), { statusCode: 409 });
    const updated = (await query(`UPDATE appointments SET status=$2,updated_at=now() WHERE public_id=$1 RETURNING public_id,status,updated_at`, [id,status]))[0];
    await query(`INSERT INTO appointment_status_history(appointment_id,from_status,to_status,changed_by,note) SELECT id,$2,$3,$4,$5 FROM appointments WHERE public_id=$1`, [id,a.status,status,userId,note||null]);
    return updated;
  }
};
