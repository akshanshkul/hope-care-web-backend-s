import { auditModel } from '../models/audit.model';

export const auditService = {
  record: auditModel.create
};
