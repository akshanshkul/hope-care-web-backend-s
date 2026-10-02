import { PoolClient } from 'pg';
import { query, withTransaction } from '../db/client';
import { attachDocument } from './document';

type AddressInput = Record<string, string | number | undefined> & { addressType: string; documentId: string };
async function patientId(client: PoolClient, userId: string) { const row = (await client.query('SELECT id FROM patients WHERE user_id=$1', [userId])).rows[0]; if (!row) throw new Error('Patient not found'); return row.id as string; }
function select(alias = 'a') {
  return `${alias}.public_id AS "addressId",
    ${alias}.address_type AS "addressType",
    ${alias}.address_line_1 AS "addressLine1",
    ${alias}.address_line_2 AS "addressLine2",
    ${alias}.landmark,
    ${alias}.country,
    ${alias}.state,
    ${alias}.district,
    ${alias}.city,
    ${alias}.tehsil,
    ${alias}.village,
    ${alias}.pincode,
    ${alias}.latitude,
    ${alias}.longitude,
    ${alias}.version,
    ${alias}.status,
    ${alias}.is_active AS "isActive",
    ${alias}.created_at AS "createdAt",
    ${alias}.deactivated_at AS "deactivatedAt"`;
}
export async function replaceAddress(userId: string, input: AddressInput, previousId?: string) {
  return withTransaction(async client => {
    const pid = await patientId(client, userId);
    const old = (await client.query(`SELECT * FROM patient_addresses WHERE patient_id=$1 AND address_type=$2 AND is_active=true FOR UPDATE`, [pid,input.addressType])).rows[0];
    if (previousId) {
      const requested = (await client.query('SELECT id FROM patient_addresses WHERE public_id=$1 AND patient_id=$2 AND is_active=true', [previousId,pid])).rows[0];
      if (!requested || !old || requested.id !== old.id) throw new Error('Address is not active or owned by patient');
    }
    const doc = await attachDocument(client, userId, input.documentId, input.addressType === 'CURRENT' || input.addressType === 'PERMANENT' ? 'ADDRESS_PROOF' : undefined);
    if (old) {
      await client.query(`UPDATE patient_addresses SET is_active=false,is_current=false,is_primary=false,status='INACTIVE',deactivated_at=now(),updated_at=now() WHERE id=$1`, [old.id]);
    }
    const row = (await client.query(
      `INSERT INTO patient_addresses(
         patient_id, line1, line2, city, state, postal_code, country, is_primary,
         address_type, address_line_1, address_line_2, landmark, district, tehsil,
         village, pincode, latitude, longitude, document_id, status, is_active,
         is_current, version, previous_address_id
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, true,
         $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
         'PENDING_VERIFICATION', true, true, $19, $20
       ) RETURNING id,${select('patient_addresses')}`,
      [
        pid,
        input.addressLine1,
        input.addressLine2 || null,
        input.city,
        input.state,
        input.pincode,
        input.country,
        input.addressType,
        input.addressLine1,
        input.addressLine2 || null,
        input.landmark || null,
        input.district,
        input.tehsil || null,
        input.village || null,
        input.pincode,
        input.latitude || null,
        input.longitude || null,
        doc.id,
        old ? old.version + 1 : 1,
        old?.id || null
      ]
    )).rows[0];
    await client.query(`UPDATE documents SET status='ATTACHED',is_temporary=false,expires_at=null,updated_at=now() WHERE id=$1`, [doc.id]);
    await client.query(`INSERT INTO address_status_history(address_id,new_status,changed_by,reason) VALUES($1,'PENDING_VERIFICATION',$2,'Address created')`, [row.id,userId]);
    await client.query(`INSERT INTO address_audit_logs(actor_user_id,patient_id,action,old_address_id,new_address_id) VALUES($1,$2,$3,$4,$5)`, [userId,pid,old ? 'ADDRESS_UPDATED' : 'ADDRESS_CREATED',old?.id || null,row.id]);
    return row;
  });
}
export async function activeAddresses(userId: string) {
  const rows = await query<{ addressType: string }>(`SELECT ${select()} FROM patient_addresses a JOIN patients p ON p.id=a.patient_id WHERE p.user_id=$1 AND a.is_active ORDER BY a.address_type`, [userId]);
  return { current: rows.find((row) => row.addressType === 'CURRENT') || null, permanent: rows.find((row) => row.addressType === 'PERMANENT') || null };
}
export async function history(userId: string) { return query(`SELECT ${select()} FROM patient_addresses a JOIN patients p ON p.id=a.patient_id WHERE p.user_id=$1 ORDER BY a.address_type,a.version DESC`, [userId]); }
export async function getAddress(userId: string, id: string) { return (await query(`SELECT ${select()} FROM patient_addresses a JOIN patients p ON p.id=a.patient_id WHERE p.user_id=$1 AND a.public_id=$2`, [userId,id]))[0]; }
export async function statusHistory(userId: string, id: string) { return query(`SELECT h.old_status AS "oldStatus",h.new_status AS status,h.created_at AS "changedAt" FROM address_status_history h JOIN patient_addresses a ON a.id=h.address_id JOIN patients p ON p.id=a.patient_id WHERE p.user_id=$1 AND a.public_id=$2 ORDER BY h.created_at`, [userId,id]); }
