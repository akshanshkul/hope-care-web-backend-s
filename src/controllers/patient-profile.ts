import { NextFunction, Request, Response } from 'express';
import { query } from '../db/client';

export async function updatePatientProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const document = (await query(`SELECT id FROM documents WHERE public_id=$1 AND owner_user_id=$2 AND document_type='PROFILE_PHOTO' AND status IN ('TEMPORARY','ATTACHED') AND deleted_at IS NULL`, [req.body.profileDocumentId, req.user!.id]))[0];
    if (!document) return res.status(400).json({ error: 'Valid profile photo document is required' });
    const patient = (await query(`UPDATE patients SET profile_image_key=(SELECT storage_key FROM documents WHERE id=$1),updated_at=now() WHERE user_id=$2 RETURNING public_id AS "patientId",profile_image_key AS "profileImageKey"`, [document.id, req.user!.id]))[0];
    await query(`UPDATE documents SET status='ATTACHED',is_temporary=false,expires_at=null,updated_at=now() WHERE id=$1`, [document.id]);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (error) { next(error); }
}
