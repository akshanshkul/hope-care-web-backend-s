import { query } from '../db/client';

type ProfileInput = {
  displayName?: string;
  phone?: string;
  alternatePhone?: string;
  profileImageKey?: string;
  officeAddress?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

export const profileModel = {
  async find(role: string, accountId: string) {
    if (role === 'PATIENT') {
      return (await query(
        `SELECT p.public_id, p.first_name, p.last_name, p.preferred_name,
                p.phone, p.alternate_phone, p.profile_image_key, p.emergency_contact,
                p.updated_at
         FROM patients p
         WHERE p.user_id = $1 LIMIT 1`,
        [accountId]
      ))[0];
    }
    const table = role === 'DOCTOR' ? 'doctors d'
      : role === 'HOSPITAL' ? 'hospitals h'
      : role.startsWith('CMO_') ? 'cmo_accounts c' : null;
    const key = role === 'DOCTOR' ? 'd.account_id'
      : role === 'HOSPITAL' ? 'h.account_id' : 'c.id';
    if (!table) return undefined;
    return (await query(
      `SELECT ${role === 'DOCTOR' ? 'd.*' : role === 'HOSPITAL' ? 'h.*' : 'c.*'} FROM ${table} WHERE ${key} = $1 LIMIT 1`,
      [accountId]
    ))[0];
  },

  async upsert(role: string, accountId: string, input: ProfileInput) {
    if (role === 'PATIENT') {
      const rows = await query(
        `UPDATE patients SET
           preferred_name = COALESCE($2, preferred_name),
           phone = COALESCE($3, phone),
           alternate_phone = COALESCE($4, alternate_phone),
           profile_image_key = COALESCE($5, profile_image_key),
           updated_at = now()
         WHERE user_id = $1 RETURNING *`,
        [accountId, input.displayName || null, input.phone || null, input.alternatePhone || null, input.profileImageKey || null]
      );
      return rows[0];
    }
    const table = role === 'DOCTOR' ? 'doctors'
      : role === 'HOSPITAL' ? 'hospitals'
      : role.startsWith('CMO_') ? 'cmo_accounts' : null;
    const key = role === 'DOCTOR' ? 'account_id'
      : role === 'HOSPITAL' ? 'account_id' : 'id';
    if (!table) throw new Error('Profile is not supported for this account');
    const isDoctor = role === 'DOCTOR';
    const rows = await query(
      `UPDATE ${table} SET display_name = COALESCE($2, display_name),
       phone = COALESCE($3, phone), alternate_phone = COALESCE($4, alternate_phone),
       profile_image_key = COALESCE($5, profile_image_key),
       ${isDoctor ? 'address_line = COALESCE($6, address_line), city = COALESCE($7, city), state = COALESCE($8, state), postal_code = COALESCE($9, postal_code)' : 'office_address = COALESCE($6, office_address)'}
       WHERE ${key} = $1 RETURNING *`,
      [accountId, input.displayName || null, input.phone || null, input.alternatePhone || null,
       input.profileImageKey || null, input.officeAddress || input.addressLine || null,
       ...(isDoctor ? [input.city || null, input.state || null, input.postalCode || null] : [])]
    );
    return rows[0];
  }
};
