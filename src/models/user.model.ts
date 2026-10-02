import { query } from '../db/client';
import { roleModel } from './role.model';
import { hashIdentity } from '../security/identity';

export type UserModel = {
  id: string;
  public_id: string;
  email: string;
  password_hash: string;
  role: string;
  role_id: string;
};

export const userModel = {
  async findByEmail(email: string): Promise<UserModel | undefined> {
    const rows = await query<UserModel>(
      'SELECT u.id, u.public_id, u.email, u.password_hash, u.role, u.role_id FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = $1 LIMIT 1',
      [email.toLowerCase()]
    );
    return rows[0];
  },

  async findById(id: string): Promise<UserModel | undefined> {
    const rows = await query<UserModel>(
      'SELECT u.id, u.public_id, u.email, u.password_hash, u.role, u.role_id FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1 LIMIT 1',
      [id]
    );
    return rows[0];
  },

  async create(email: string, passwordHash: string, role: string): Promise<UserModel> {
    const roleRecord = await roleModel.findByName(role);
    if (!roleRecord) throw Object.assign(new Error('Invalid role'), { statusCode: 400 });
    const rows = await query<UserModel>(
      `INSERT INTO users (public_id, email, password_hash, role, role_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING id, public_id, email, password_hash, role, role_id`,
      [email.toLowerCase(), passwordHash, roleRecord.name, roleRecord.id]
    );
    const user = rows[0];
    if (role === 'ADMIN') {
      await query('INSERT INTO admins (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [user.id]);
    } else if (role === 'NATIONAL_ADMIN') {
      await query('INSERT INTO national_admins (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [user.id]);
    }
    if (role === 'PATIENT') {
      const patient = await query<{ id: string }>(
        `INSERT INTO patients (user_id, identity_hash) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
         RETURNING id`,
        [user.id, hashIdentity(email)]
      );
    }
    return user;
  }
};
