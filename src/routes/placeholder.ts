import { Router } from 'express';
import { authenticate, requireRoles, jurisdiction } from '../middleware/auth';
import { presignUpload } from '../controllers/storage';
import { getMyProfile, updateMyProfile } from '../controllers/profile';

const r = Router();
r.get('/patients/me', authenticate, jurisdiction, requireRoles('PATIENT', 'ADMIN', 'NATIONAL_ADMIN'), (req, res) => res.json({ userId: req.user?.id }));
r.get('/doctors', authenticate, requireRoles('DOCTOR', 'ADMIN', 'NATIONAL_ADMIN', 'STAFF'), (_req, res) => res.json({ data: [] }));
r.get('/hospitals', authenticate, requireRoles('HOSPITAL', 'ADMIN', 'NATIONAL_ADMIN', 'STAFF'), (_req, res) => res.json({ data: [] }));
r.post('/files/presign', authenticate, requireRoles('PATIENT', 'DOCTOR', 'HOSPITAL', 'STAFF', 'ADMIN', 'NATIONAL_ADMIN'), presignUpload);
r.get('/profile/me', authenticate, requireRoles('PATIENT', 'DOCTOR', 'HOSPITAL', 'CMO_DISTRICT', 'CMO_STATE', 'CMO_NOMINEE_AC', 'ADMIN', 'NATIONAL_ADMIN'), getMyProfile);
r.patch('/profile/me', authenticate, requireRoles('PATIENT', 'DOCTOR', 'HOSPITAL', 'CMO_DISTRICT', 'CMO_STATE', 'CMO_NOMINEE_AC', 'ADMIN', 'NATIONAL_ADMIN'), updateMyProfile);
export default r;
