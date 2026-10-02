import { z } from 'zod';
const id = z.string().uuid();
export const historySchema = z.object({
  condition: z.string().trim().min(1).max(200),
  details: z.string().trim().max(5000).optional(),
  diagnosedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});
export const departmentSchema = z.object({ name: z.string().trim().min(2).max(120), description: z.string().trim().max(1000).optional() });
export const hospitalSchema = z.object({
  name: z.string().trim().min(2).max(200),
  address: z.string().trim().max(500).optional(),
  addressLine1: z.string().trim().max(200).optional(),
  addressLine2: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(200).optional(),
  district: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  pincode: z.string().regex(/^[0-9]{4,10}$/).optional(),
  country: z.string().trim().max(100).optional(),
  cityId: id.optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().email().optional(),
  website: z.string().url().max(500).optional(),
  emergencyPhone: z.string().trim().max(30).optional(),
  description: z.string().trim().max(2000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
});
export const bookingSchema = z.object({
  hospitalId: id, doctorId: id.optional(), departmentId: id.optional(),
  scheduledAt: z.string().datetime({ offset: true }), reason: z.string().trim().min(3).max(1000)
});
export const routeSchema = z.object({ doctorId: id, departmentId: id.optional(), note: z.string().trim().max(1000).optional() });
export const associationSchema = z.object({ doctorId: id, departmentId: id.optional() });
export const statusSchema = z.object({
  status: z.enum(['CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','REJECTED']), note: z.string().trim().max(1000).optional()
});
