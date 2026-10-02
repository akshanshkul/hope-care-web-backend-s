import { query } from '../db/client';

export const auditModel = {
  async create(actorId: string | null, action: string, entityType: string, entityId?: string) {
    await query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id)
       VALUES ($1, $2, $3, $4)`,
      [actorId, action, entityType, entityId || null]
    );
  }
};
