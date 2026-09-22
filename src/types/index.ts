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
  CHAMBER = "CHAMBER",
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
  // Prescription rendering defaults (Settings → Prescription).
  prescriptionLanguage?: PrescriptionLanguage;
  prescriptionTemplate?: PrescriptionDesignTemplate;
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
  /** The current user's role in this workspace (from GET /workspaces). */
  role?: WorkspaceRole;
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
  weight?: number;
  address?: string;
  allergies?: string;
  /** Backend field name. */
  chronicDiseases?: string;
  /** Backwards-compatible alias kept for older call sites. */
  chronicConditions?: string;
  emergencyContact?: string;
  /** Backend field name. */
  patientNotes?: string;
  /** Backwards-compatible alias kept for older call sites. */
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

// Prescription rendering language. Only the doctor's instructions, advice,
// next-visit label and medicine meal-timing labels are translated.
export enum PrescriptionLanguage {
  ENGLISH = "ENGLISH",
  BANGLA = "BANGLA",
}

// Visual layout of a prescription. All templates share the same data.
export enum PrescriptionDesignTemplate {
  DEFAULT = "DEFAULT",
  MODERN_CLINICAL = "MODERN_CLINICAL",
  MINIMAL_PROFESSIONAL = "MINIMAL_PROFESSIONAL",
  MODERN_MEDICAL = "MODERN_MEDICAL",
  ELEGANT_COMPACT = "ELEGANT_COMPACT",
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

export interface PrescriptionInvestigation {
  id?: string;
  testName: string;
  note?: string;
  order?: number;
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
  /** Relevant past medical history (separate from chief complaints). */
  history?: string;
  /** On Examination findings — free text shorthand ("Nil", "+", "Mild"). */
  examRespiratoryRate?: string;
  examLungs?: string;
  examHeart?: string;
  examAnaemia?: string;
  examCyanosis?: string;
  examOedema?: string;
  examDehydration?: string;
  examOthers?: string;
  investigations?: PrescriptionInvestigation[];
  medicines: PrescriptionMedicine[];
  status: PrescriptionStatus;
  language?: PrescriptionLanguage;
  template?: PrescriptionDesignTemplate;
  pdfUrl?: string;
  verificationCode?: string;
  patient?: Patient;
  chamber?: Chamber;
  createdAt: string;
  updatedAt: string;
}

// ─── Finance (internal business finance — Phase 3) ────────────────────────────

export enum FinancialTransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "BANK_TRANSFER"
  | "MOBILE_BANKING"
  | "CHEQUE"
  | "ONLINE_GATEWAY";

export interface FinancialCategory {
  id: string;
  workspaceId: string | null;
  name: string;
  type: FinancialTransactionType;
  description?: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinancialTransaction {
  id: string;
  workspaceId: string;
  workspace?: { id: string; name: string };
  createdById: string;
  createdBy?: { id: string; name: string };
  type: FinancialTransactionType;
  amount: number;
  categoryId: string;
  category?: { id: string; name: string; type: FinancialTransactionType };
  paymentMethod: PaymentMethod;
  description?: string | null;
  notes?: string | null;
  transactionDate: string;
  patientId?: string | null;
  patient?: { id: string; name: string } | null;
  appointmentId?: string | null;
  prescriptionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  netResult: number;
  incomeCount: number;
  expenseCount: number;
  transactionCount: number;
  currency: string;
  workspaceCount: number;
  period: { period: string; start: string | null; end: string | null };
}

export interface FinanceCategoryTotal {
  categoryId: string;
  name: string;
  total: number;
  count: number;
}

export interface FinanceWorkspaceTotal {
  workspaceId: string;
  workspaceName: string;
  income: number;
  expense: number;
  net: number;
}

export interface FinanceReport {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netResult: number;
    incomeCount: number;
    expenseCount: number;
    transactionCount: number;
  };
  incomeByCategory: FinanceCategoryTotal[];
  expenseByCategory: FinanceCategoryTotal[];
  timeSeries: { bucket: string; income: number; expense: number; net: number }[];
  workspaceSummary: FinanceWorkspaceTotal[];
  currency: string;
  period: {
    period: string;
    start: string | null;
    end: string | null;
    groupBy: string;
  };
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

// Matches the backend AppointmentStatus enum.
export enum AppointmentStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum AppointmentType {
  NORMAL = "NORMAL",
  FOLLOW_UP = "FOLLOW_UP",
}

export enum AppointmentPaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FREE = "FREE",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export interface Appointment {
  id: string;
  patientId: string;
  chamberId?: string | null;
  workspaceId: string;
  serialNumber?: number;
  serialNo?: number;
  scheduledDate?: string;
  appointmentDate?: string;
  status: AppointmentStatus;
  appointmentType?: AppointmentType;
  visitingFee?: number | null;
  discount?: number;
  payableAmount?: number | null;
  paidAmount?: number;
  paymentStatus?: AppointmentPaymentStatus;
  paymentMethod?: string | null;
  paidAt?: string | null;
  revenueSharePercent?: number | null;
  hospitalShareAmount?: number | null;
  doctorShareAmount?: number | null;
  followUpOfId?: string | null;
  notes?: string;
  patient?: Patient;
  chamber?: Chamber;
  doctor?: { id: string; name: string };
  createdAt: string;
}

export interface VisitingFee {
  id: string;
  doctorId: string;
  workspaceId: string;
  visitingFee: number;
  followUpFee: number | null;
  isActive: boolean;
}

export interface RevenueShareOverride {
  doctorId: string;
  doctorName: string;
  percentage: number;
}

export interface RevenueShareConfig {
  defaultPercentage: number;
  overrides: RevenueShareOverride[];
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
  type: "PERSONAL" | "INSTITUTION" | "DOCTOR";
  status: VerificationStatus;
  submittedData?: Record<string, unknown>;
  submittedAt: string;
  reviewerNotes?: string;
  reviewedAt?: string;
  user?: Pick<User, "id" | "name" | "email">;
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
