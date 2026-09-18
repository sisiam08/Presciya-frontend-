import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Patient schemas
export const patientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  age: z.number().min(0).max(150, "Invalid age"),
  gender: z.enum(["MALE", "FEMALE"]),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
});

export const patientSearchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().default(10),
});

// Prescription schemas
export const prescriptionMedicineSchema = z.object({
  medicineId: z.string().optional(),
  brandName: z.string().min(1, "Brand name is required"),
  generic: z.string().min(1, "Generic name is required"),
  strength: z.string().optional(),
  type: z.string().optional(),
  dosagePattern: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  mealTiming: z.string().optional(),
  instruction: z.string().optional(),
});

export const prescriptionSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  chamberId: z.string().optional(),
  complaints: z.string().optional(),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  clinicalNotes: z.string().optional(),
  advises: z.string().optional(),
  nextVisitDate: z.date().optional(),
  bloodPressure: z.string().optional(),
  pulse: z.string().optional(),
  temperature: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  medicines: z
    .array(prescriptionMedicineSchema)
    .min(1, "At least one medicine is required"),
  status: z.enum(["DRAFT", "FINALIZED", "CANCELLED"]).default("DRAFT"),
});

// Chamber schemas
export const chamberSchema = z.object({
  name: z.string().min(2, "Chamber name is required"),
  address: z.string().min(5, "Address is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  visitingHours: z.string().optional(),
});

// Medicine search schema
export const medicineSearchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  limit: z.number().default(10),
});

// Profile schemas
export const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  image: z.string().url().optional(),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type PatientFormData = z.infer<typeof patientSchema>;
export type PrescriptionFormData = z.infer<typeof prescriptionSchema>;
export type ChamberFormData = z.infer<typeof chamberSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;
