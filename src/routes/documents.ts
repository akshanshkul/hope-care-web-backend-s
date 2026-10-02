import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadDocumentSchema } from '../validation/address-documents';
import * as c from '../controllers/documents';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
const r = Router();
const patientRoles = requireRoles('PATIENT', 'DOCTOR', 'HOSPITAL', 'STAFF', 'ADMIN', 'NATIONAL_ADMIN');
r.post('/documents/upload', authenticate, patientRoles, upload.single('file'), validate(uploadDocumentSchema), c.upload);
r.get('/documents/:documentId', authenticate, patientRoles, c.get);
r.get('/documents/:documentId/url', authenticate, patientRoles, c.url);
r.delete('/documents/:documentId', authenticate, patientRoles, c.remove);
export default r;
