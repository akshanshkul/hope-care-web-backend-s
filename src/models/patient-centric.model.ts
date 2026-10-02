import { query } from '../db/client';

export const patientCentricModel = {
  async auditAccess(userId: string, patientId: string | null, resourceType: string, resourceId: string | null, action: string) {
    await query(`INSERT INTO clinical_access_audit(actor_id,patient_id,resource_type,resource_id,action) VALUES($1,$2,$3,$4,$5)`, [userId, patientId, resourceType, resourceId, action]);
  },
  async profile(userId: string) {
    return (await query(`SELECT p.public_id, p.date_of_birth, p.verification_status, p.first_name, p.last_name, p.preferred_name, p.phone, p.alternate_phone, p.profile_image_key, p.sex_at_birth, p.blood_group, p.emergency_contact FROM patients p WHERE p.user_id=$1`, [userId]))[0];
  },
  async updateProfile(userId: string, x: Record<string, unknown>) {
    return (await query(`UPDATE patients SET first_name=$2,last_name=$3,preferred_name=$4,sex_at_birth=$5,blood_group=$6,emergency_contact=$7,updated_at=now() WHERE user_id=$1 RETURNING *`, [userId,x.firstName||null,x.lastName||null,x.preferredName||null,x.sexAtBirth||null,x.bloodGroup||null,x.emergencyContact||null]))[0];
  },
  async records(userId: string) {
    const patient = (await query<{ id: string }>('SELECT id FROM patients WHERE user_id=$1', [userId]))[0];
    if (patient) await this.auditAccess(userId, patient.id, 'PATIENT_MEDICAL_RECORDS', null, 'READ');
    return query(`SELECT r.public_id,r.record_type,r.title,r.clinical_data,r.recorded_at FROM patient_medical_records r JOIN patients p ON p.id=r.patient_id WHERE p.user_id=$1 ORDER BY r.recorded_at DESC`, [userId]);
  },
  async addRecord(userId: string, x: any) {
    return (await query(`INSERT INTO patient_medical_records(patient_id,authored_by,record_type,title,clinical_data) SELECT id,$1,$2,$3,$4::jsonb FROM patients WHERE user_id=$1 RETURNING public_id,record_type,title,clinical_data,recorded_at`, [userId,x.recordType,x.title,JSON.stringify(x.clinicalData||{})]))[0];
  },
  async roles(userId: string) {
    return query(`SELECT r.id,r.name,r.description,ur.is_primary FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=$1 ORDER BY ur.is_primary DESC,r.name`, [userId]);
  }
};
