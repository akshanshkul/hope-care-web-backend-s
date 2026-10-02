import { query } from '../db/client';

export const ROLE_NAMES = ['PATIENT', 'DOCTOR', 'HOSPITAL', 'CMO_DISTRICT', 'CMO_STATE', 'CMO_NOMINEE_AC', 'ADMIN', 'NATIONAL_ADMIN', 'STAFF', 'AUDITOR'] as const;
export type RoleName = typeof ROLE_NAMES[number];
export type Role = { id: string; name: string; description?: string };

export const roleModel = {
  async findByName(name: string): Promise<Role | undefined> {
    return (await query<Role>('SELECT id, name, description FROM roles WHERE name = $1 LIMIT 1', [name]))[0];
  },
  async list(): Promise<Role[]> {
    return query<Role>('SELECT id, name, description FROM roles ORDER BY name');
  }
};
