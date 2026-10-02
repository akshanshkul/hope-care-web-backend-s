import { query } from '../db/client';

export const patientModel = {
  async findByIdentityHash(identityHash: string) {
    const rows = await query<{ id: string }>(
      'SELECT id FROM patients WHERE identity_hash = $1 LIMIT 1',
      [identityHash]
    );
    return rows[0];
  },

  async completeRegistration(userId: string, firstName: string, lastName: string, mobile: string, identityHash: string) {
    const rows = await query(
      `UPDATE patients
       SET first_name = $2, last_name = $3, mobile = $4, identity_hash = $5, updated_at = now()
       WHERE user_id = $1
       RETURNING public_id, first_name, last_name, mobile, verification_status`,
      [userId, firstName, lastName, mobile, identityHash]
    );
    return rows[0];
  },

  async findByPublicId(publicId: string) {
    const rows = await query(
      `SELECT public_id, verification_status, city_id, created_at, updated_at
       FROM patients
       WHERE public_id = $1
       LIMIT 1`,
      [publicId]
    );
    return rows[0];
  }
};
