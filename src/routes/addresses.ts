import { Router } from 'express';
import { authenticate, requireRoles } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createAddressSchema, updateAddressSchema, profileDocumentSchema } from '../validation/address-documents';
import * as c from '../controllers/addresses';
import { updatePatientProfile } from '../controllers/patient-profile';

const r = Router();
const patient = [authenticate, requireRoles('PATIENT')] as const;
r.post('/patients/me/addresses', ...patient, validate(createAddressSchema), c.create);
r.get('/patients/me/addresses', ...patient, c.active);
r.get('/patients/me/addresses/history', ...patient, c.all);
r.get('/patients/me/addresses/:addressId/status-history', ...patient, c.statuses);
r.get('/patients/me/addresses/:addressId', ...patient, c.one);
r.put('/patients/me/addresses/:addressId', ...patient, validate(updateAddressSchema), c.update);
r.put('/patients/me/profile', ...patient, validate(profileDocumentSchema), updatePatientProfile);
export default r;
