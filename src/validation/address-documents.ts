import { z } from 'zod';

export const documentTypes = ['MEDICAL_REPORT','PRESCRIPTION','LAB_REPORT','DISCHARGE_SUMMARY','AADHAAR','ADDRESS_PROOF','PROFILE_PHOTO','DOCTOR_CERTIFICATE','OTHER'] as const;
export const addressTypes = ['CURRENT','PERMANENT'] as const;

export const uploadDocumentSchema = z.object({
  documentType: z.enum(documentTypes)
});

const addressFields = {
  addressType: z.enum(addressTypes),
  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(200).optional(),
  country: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  tehsil: z.string().trim().max(100).optional(),
  village: z.string().trim().max(100).optional(),
  pincode: z.string().regex(/^[0-9]{4,10}$/),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  documentId: z.string().uuid()
};
export const createAddressSchema = z.object(addressFields);
export const updateAddressSchema = z.object({ ...addressFields }).partial().extend({ documentId: z.string().uuid() });
export const profileDocumentSchema = z.object({ profileDocumentId: z.string().uuid() });
