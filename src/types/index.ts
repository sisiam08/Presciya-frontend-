// ─── System / Auth Enums ─────────────────────────────────────────────────────

export enum SystemRole {
  USER = "USER",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum WorkspaceRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  DOCTOR = "DOCTOR",
  MANAGER = "MANAGER",
  ASSISTANT = "ASSISTANT",
}

export enum WorkspaceType {
  PERSONAL = "PERSONAL",
  INSTITUTION = "INSTITUTION",
}

export enum MembershipStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum VerificationStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  systemRole: SystemRole;
  isActive: boolean;
  isVerified: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Doctor Profile ──────────────────────────────────────────────────────────

export interface DoctorProfile {
  id: string;
  userId: string;
  bmdcNumber?: string;
  qualifications?: string;
  specialization?: string;
  yearsOfExperience?: number;
  signatureUrl?: string;
  verificationStatus: VerificationStatus;
  bio?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

// ─── Workspace ───────────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  type: WorkspaceType;
  ownerId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  status: MembershipStatus;
  workspace?: Workspace;
  user?: User;
  createdAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  workspaceId: string;
  role: WorkspaceRole;
  status: string;
  workspace?: Workspace;
  createdAt: string;
  expiresAt?: string;
}

// ─── Patient ─────────────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth?: string;
  age?: number;
  bloodGroup?: string;
  address?: string;
  allergies?: string;
  chronicConditions?: string;
  emergencyContact?: string;
  medicalNotes?: string;
  patientId?: string;
  workspaceId?: string;
  lastVisit?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientTimeline {
  id: string;
  patientId: string;
  eventType: string;
  description?: string;
  entityId?: string;
  createdAt: string;
}

// ─── Chamber ─────────────────────────────────────────────────────────────────

export interface Chamber {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  visitingHours?: string;
  logo?: string;
  footerText?: string;
  workspaceId?: string;
  isActive: boolean;
  schedules?: ChamberSchedule[];
  createdAt: string;
  updatedAt: string;
}

export interface ChamberSchedule {
  id: string;
  chamberId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration?: number;
  maxPatients?: number;
}

// ─── Prescription ─────────────────────────────────────────────────────────────

export enum PrescriptionStatus {
  DRAFT = "DRAFT",
  FINALIZED = "FINALIZED",
  CANCELLED = "CANCELLED",
}

export interface PrescriptionMedicine {
  medicineId?: string;
  brandName: string;
  generic?: string;
  strength?: string;
  type?: string;
  dosagePattern?: string;
  frequency?: string;
  duration?: string;
  mealTiming?: string;
  instruction?: string;
  usageType?: string;
  morning?: number;
  noon?: number;
  night?: number;
  intervalDays?: number;
  specificDays?: string[] | string;
  applicationArea?: string;
  applicationAmount?: string;
  applicationFrequency?: string;
  dose?: string;
  frequencyMorning?: number;
  frequencyNoon?: number;
  frequencyNight?: number;
  durationValue?: number;
  durationUnit?: string;
  customScheduleJson?: Record<string, unknown>;
  notes?: string;
  quantity?: number;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId?: string;
  chamberId?: string;
  workspaceId?: string;
  serialNumber?: string;
  complaints?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  advises?: string;
  nextVisitDate?: string;
  medicines: PrescriptionMedicine[];
  status: PrescriptionStatus;
  pdfUrl?: string;
  verificationCode?: string;
  patient?: Patient;
  chamber?: Chamber;
  createdAt: string;
  updatedAt: string;
}

// ─── Medicine ────────────────────────────────────────────────────────────────

export interface Medicine {
  id: string;
  brandName: string;
  genericName?: string;
  strength?: string;
  form?: string;
  manufacturer?: string;
  isFavorite?: boolean;
}

// ─── Appointment ─────────────────────────────────────────────────────────────

export enum AppointmentStatus {
  SCHEDULED = "SCHEDULED",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export interface Appointment {
  id: string;
  patientId: string;
  chamberId: string;
  workspaceId: string;
  serialNumber: number;
  scheduledDate: string;
  status: AppointmentStatus;
  notes?: string;
  patient?: Patient;
  chamber?: Chamber;
  createdAt: string;
}

// ─── Notification ────────────────────────────────────────────────────────────

export enum NotificationType {
  VERIFICATION = "VERIFICATION",
  INVITATION = "INVITATION",
  PRESCRIPTION = "PRESCRIPTION",
  APPOINTMENT = "APPOINTMENT",
  PAYMENT = "PAYMENT",
  SUBSCRIPTION = "SUBSCRIPTION",
  SYSTEM = "SYSTEM",
  USER_ACTION = "USER_ACTION",
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  entityId?: string;
  entityType?: string;
  createdAt: string;
}

// ─── Subscription / Billing ──────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  period: "MONTHLY" | "YEARLY";
  features: PlanFeature[];
}

export interface PlanFeature {
  id: string;
  featureKey: string;
  featureName: string;
  limitValue?: number;
}

export interface UserSubscription {
  id: string;
  userId: string;
  workspaceId?: string;
  planVariantId: string;
  status: string;
  startDate: string;
  endDate?: string;
  prescriptionsUsedToday: number;
  dailyLimit: number;
  planVariant?: SubscriptionPlan;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: string;
  createdAt: string;
}

// ─── Verification ────────────────────────────────────────────────────────────

export interface VerificationRequest {
  id: string;
  userId: string;
  type: "DOCTOR" | "INSTITUTION";
  status: VerificationStatus;
  submittedData?: Record<string, unknown>;
  reviewerNotes?: string;
  reviewedAt?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

// ─── Institution ─────────────────────────────────────────────────────────────

export interface InstitutionProfile {
  id: string;
  workspaceId: string;
  legalName: string;
  registrationNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export interface Department {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  isActive: boolean;
  doctorCount?: number;
  createdAt: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface AnalyticsDashboard {
  prescriptionsToday: number;
  prescriptionsTotal: number;
  patientsTotal: number;
  appointmentsToday: number;
  recentPrescriptions?: Prescription[];
  prescriptionsByDay?: { date: string; count: number }[];
}

// ─── API Response Helpers ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
  duration?: number;
}

export interface FormFieldProps {
  label: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}
