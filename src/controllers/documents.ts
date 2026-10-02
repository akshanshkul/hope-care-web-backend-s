import { NextFunction, Request, Response } from 'express';
import { deleteDocument, documentUrl, getDocument, uploadDocument } from '../services/document';

export async function upload(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ error: 'A file is required' });
    const documentType = String(req.body.documentType);
    res.status(201).json({ success: true, document: await uploadDocument(req.user!.id, documentType, req.file) });
  } catch (error) { next(error); }
}
export async function get(req: Request, res: Response, next: NextFunction) {
  try { const data = await getDocument(req.user!.id, String(req.params.documentId)); if (!data) return res.status(404).json({ error: 'Document not found' }); res.json({ success: true, document: data }); } catch (error) { next(error); }
}
export async function url(req: Request, res: Response, next: NextFunction) {
  try { res.json({ success: true, url: await documentUrl(req.user!.id, String(req.params.documentId)), expiresIn: 300 }); } catch (error) { next(error); }
}
export async function remove(req: Request, res: Response, next: NextFunction) {
  try { await deleteDocument(req.user!.id, String(req.params.documentId)); res.status(204).send(); } catch (error) { next(error); }
}
