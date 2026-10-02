import { query } from '../db/client';

export type CmoModel = {
  id: string;
  public_id: string;
  email: string;
  password_hash: string;
  cmo_type: 'DISTRICT' | 'STATE' | 'NOMINEE_AC';
  jurisdiction_code: string | null;
  district_id: string | null;
};

export const cmoModel = {
  async findByEmail(email: string) {
    return (await query<CmoModel>(
      `SELECT id, public_id, email, password_hash, cmo_type, jurisdiction_code, district_id
       FROM cmo_accounts WHERE email = $1 LIMIT 1`,
      [email.toLowerCase()]
    ))[0];
  },

  async findById(id: string) {
    return (await query<CmoModel>(
      `SELECT id, public_id, email, password_hash, cmo_type, jurisdiction_code, district_id
       FROM cmo_accounts WHERE id = $1 LIMIT 1`,
      [id]
    ))[0];
  },

  async create(email: string, passwordHash: string, cmoType: CmoModel['cmo_type']) {
    const rows = await query<CmoModel>(
      `INSERT INTO cmo_accounts (email, password_hash, cmo_type)
       VALUES ($1, $2, $3)
       RETURNING id, public_id, email, password_hash, cmo_type, jurisdiction_code, district_id`,
      [email.toLowerCase(), passwordHash, cmoType]
    );
    return rows[0];
  }
};
