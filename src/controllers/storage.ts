import { Request, Response, NextFunction } from 'express';
import { createUploadUrl } from '../services/storage';

export async function presignUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const { key, contentType } = req.body as { key: string; contentType: string };
    const uploadUrl = await createUploadUrl(key, contentType);
    res.json({ key, uploadUrl, expiresIn: 300 });
  } catch (error) {
    next(error);
  }
}
