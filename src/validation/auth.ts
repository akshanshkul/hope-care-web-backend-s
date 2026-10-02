import { z } from 'zod';
const registerBaseSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().trim().min(2).max(100).optional(),
  lastName: z.string().trim().min(2).max(100).optional(),
  mobile: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional(),
  aadhaar: z.string().regex(/^\d{12}$/).optional(),
  degree: z.string().trim().min(2).max(150).optional(),
  registrationNumber: z.string().trim().min(2).max(100).optional(),
  role: z.enum(['PATIENT', 'DOCTOR', 'HOSPITAL', 'CMO_DISTRICT', 'CMO_STATE', 'CMO_NOMINEE_AC']).default('PATIENT')    // Privileged authorities are provisioned by an existing authority, never self-registered.
});

export const registerSchema = registerBaseSchema.superRefine((value, context) => {
  if (value.role === 'PATIENT') {
    for (const field of ['firstName', 'lastName', 'mobile', 'aadhaar'] as const) {
      if (!value[field]) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${field} is required for patient registration` });
      }
    }
  }
  if (value.role === 'DOCTOR') {
    for (const field of ['firstName', 'lastName', 'mobile', 'aadhaar', 'degree', 'registrationNumber'] as const) {
      if (!value[field]) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${field} is required for doctor registration` });
      }
    }
  }
});
// Login: role MUST be provided
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),

  role: z.enum([
    'PATIENT',
    'DOCTOR',
    'HOSPITAL',
    'CMO_DISTRICT',
    'CMO_STATE',
    'CMO_NOMINEE_AC'
  ])
});