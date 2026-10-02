import { z } from 'zod';
export const patientProfileSchema = z.object({
  firstName: z.string().trim().max(100).optional(), lastName: z.string().trim().max(100).optional(),
  preferredName: z.string().trim().max(100).optional(), sexAtBirth: z.string().trim().max(40).optional(),
  bloodGroup: z.string().trim().max(10).optional(), emergencyContact: z.record(z.unknown()).optional()
});
export const medicalRecordSchema = z.object({
  recordType: z.string().trim().min(2).max(80), title: z.string().trim().min(2).max(200),
  clinicalData: z.record(z.unknown()).default({})
});
