import { query } from '../db/client';

export type ProfessionalAccount = {
  id: string;
  public_id: string;
  email: string;
  password_hash: string;
};

export const doctorAccountModel = {
  async findByEmail(email: string) {
    return (await query<ProfessionalAccount>(
      'SELECT id, public_id, email, password_hash FROM doctor_accounts WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    ))[0];
  },
  async findById(id: string) {
    return (await query<ProfessionalAccount>(
      'SELECT id, public_id, email, password_hash FROM doctor_accounts WHERE id = $1 LIMIT 1',
      [id]
    ))[0];
  },
  async create(
    email: string,
    passwordHash: string,
    details: {
      firstName: string;
      lastName: string;
      mobile: string;
      aadhaarHash: string;
      degree: string;
      registrationNumber: string;
    }
  ) {
    const account = (await query<ProfessionalAccount>(
      `INSERT INTO doctor_accounts (email, password_hash) VALUES ($1, $2)
       RETURNING id, public_id, email, password_hash`,
      [email.toLowerCase(), passwordHash]
    ))[0];
    await query(
      `INSERT INTO doctors
         (account_id, first_name, last_name, mobile, aadhaar_hash, degree, registration_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        account.id,
        details.firstName,
        details.lastName,
        details.mobile,
        details.aadhaarHash,
        details.degree,
        details.registrationNumber
      ]
    );
    return account;
  }
};

export const hospitalAccountModel = {
  async findByEmail(email: string) {
    return (await query<ProfessionalAccount>(
      'SELECT id, public_id, email, password_hash FROM hospital_accounts WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    ))[0];
  },
  async findById(id: string) {
    return (await query<ProfessionalAccount>(
      'SELECT id, public_id, email, password_hash FROM hospital_accounts WHERE id = $1 LIMIT 1',
      [id]
    ))[0];
  },
  async create(email: string, passwordHash: string) {
    return (await query<ProfessionalAccount>(
      `INSERT INTO hospital_accounts (email, password_hash) VALUES ($1, $2)
       RETURNING id, public_id, email, password_hash`,
      [email.toLowerCase(), passwordHash]
    ))[0];
  }
};
