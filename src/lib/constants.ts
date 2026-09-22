// ─── API Route Constants ──────────────────────────────────────────────────────

export const API_ROUTES = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    LOGOUT: "/auth/logout",
    LOGOUT_ALL: "/auth/logout-all",
    REFRESH: "/auth/refresh-token",
    ME: "/auth/me",
    UPDATE_ME: "/auth/me",
    FORGOT_PASSWORD: "/auth/forget-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  // ── Workspace ─────────────────────────────────────────────────────────────
  WORKSPACES: {
    LIST: "/workspaces",
    CREATE: "/workspaces",
    GET: (id: string) => `/workspaces/${id}`,
    UPDATE: (id: string) => `/workspaces/${id}`,
    DELETE: (id: string) => `/workspaces/${id}`,
    MEMBERS: (id: string) => `/workspaces/${id}/members`,
    INVITE: (id: string) => `/workspaces/${id}/members/invite`,
    UPDATE_MEMBER_ROLE: (wid: string, mid: string) => `/workspaces/${wid}/members/${mid}`,
    SUSPEND_MEMBER: (wid: string, mid: string) => `/workspaces/${wid}/members/${mid}/suspend`,
    RESTORE_MEMBER: (wid: string, mid: string) => `/workspaces/${wid}/members/${mid}/restore`,
    REMOVE_MEMBER: (wid: string, mid: string) => `/workspaces/${wid}/members/${mid}`,
    INVITATIONS: (id: string) => `/workspaces/${id}/invitations`,
    CANCEL_INVITATION: (wid: string, iid: string) => `/workspaces/${wid}/invitations/${iid}`,
    PENDING_INVITATIONS: "/workspaces/invitations/pending",
    ACCEPT_INVITATION: "/workspaces/invitations/accept",
    REJECT_INVITATION: "/workspaces/invitations/reject",
    VERIFY_INVITATION: (token: string) => `/workspaces/invitations/${token}`,
  },

  // ── Doctor Profile ────────────────────────────────────────────────────────
  DOCTOR: {
    PROFILE: "/doctor/profile",
    UPDATE_PROFILE: "/doctor/profile",
    MY_DOCTORS: "/doctor/my-doctors",
    GET: (id: string) => `/doctor/${id}`,
  },

  // ── Institution ───────────────────────────────────────────────────────────
  INSTITUTION: {
    PROFILE: "/institution/profile",
    UPDATE_PROFILE: "/institution/profile",
    UPDATE_BRANDING: "/institution/branding",
    DEPARTMENTS: "/institution/departments",
    CREATE_DEPARTMENT: "/institution/departments",
    ASSIGN_DOCTOR: "/institution/doctors/assign",
    REMOVE_DOCTOR: (id: string) => `/institution/doctors/${id}`,
    DOCTORS: "/institution/doctors",
  },

  // ── Patients ──────────────────────────────────────────────────────────────
  PATIENTS: {
    // The backend exposes patient listing through the search endpoint (empty q
    // returns all patients in the active workspace).
    LIST: "/patient/search",
    CREATE: "/patient",
    SEARCH: "/patient/search",
    GET: (id: string) => `/patient/${id}`,
    UPDATE: (id: string) => `/patient/${id}`,
    DELETE: (id: string) => `/patient/${id}`,
    TIMELINE: (id: string) => `/patient/${id}/timeline`,
  },

  // ── Prescriptions ─────────────────────────────────────────────────────────
  PRESCRIPTIONS: {
    LIST: "/prescription/my-prescriptions",
    CREATE: "/prescription",
    GET: (id: string) => `/prescription/${id}`,
    UPDATE: (id: string) => `/prescription/${id}`,
    DELETE: (id: string) => `/prescription/${id}`,
    FINALIZE: (id: string) => `/prescription/${id}/finalize`,
    PRINT: (id: string) => `/prescription/${id}/print`,
    PREVIEW: (id: string) => `/prescription/${id}/preview`,
    AMEND: (id: string) => `/prescription/${id}/amend`,
    VERIFY: (id: string) => `/prescription/${id}/verify`,
    TEMPLATE_PREVIEW: (template: string, language?: string) =>
      `/prescription/template-preview?template=${encodeURIComponent(template)}${
        language ? `&language=${encodeURIComponent(language)}` : ""
      }`,
  },

  // ── Finance (internal business finance) ───────────────────────────────────
  FINANCE: {
    TRANSACTIONS: "/finance/transactions",
    TRANSACTION: (id: string) => `/finance/transactions/${id}`,
    SUMMARY: "/finance/summary",
    REPORTS: "/finance/reports",
    CATEGORIES: "/finance/categories",
    CATEGORY: (id: string) => `/finance/categories/${id}`,
  },

  // ── Prescription templates ────────────────────────────────────────────────
  TEMPLATES: {
    LIST: "/prescription-templates",
    CREATE: "/prescription-templates",
    GET: (id: string) => `/prescription-templates/${id}`,
    DELETE: (id: string) => `/prescription-templates/${id}`,
  },

  // ── Medicines ─────────────────────────────────────────────────────────────
  MEDICINES: {
    SEARCH: "/medicine/search",
    FAVORITES: "/medicine/favorites",
    ADD_FAVORITE: "/medicine/favorites",
    REMOVE_FAVORITE: (id: string) => `/medicine/favorites/${id}`,
  },

  // ── Chambers ──────────────────────────────────────────────────────────────
  CHAMBERS: {
    LIST: "/chamber/my-chambers",
    CREATE: "/chamber",
    GET: (id: string) => `/chamber/${id}`,
    UPDATE: (id: string) => `/chamber/${id}`,
    DELETE: (id: string) => `/chamber/${id}`,
    SCHEDULES: (id: string) => `/chamber/${id}/schedules`,
    DELETE_SCHEDULE: (sid: string) => `/chamber/schedules/${sid}`,
    APPOINTMENTS: (id: string) => `/chamber/${id}/appointments`,
  },

  // ── Appointments ──────────────────────────────────────────────────────────
  APPOINTMENTS: {
    LIST: (workspaceId: string) => `/appointment/${workspaceId}`,
    CREATE: (workspaceId: string) => `/appointment/${workspaceId}`,
    UPDATE_STATUS: (workspaceId: string, id: string) =>
      `/appointment/${workspaceId}/${id}/status`,
    GET: (workspaceId: string, id: string) =>
      `/appointment/${workspaceId}/${id}`,
    SEARCH_TODAY: (workspaceId: string) =>
      `/appointment/${workspaceId}/search/today`,
    RECORD_PAYMENT: (workspaceId: string, id: string) =>
      `/appointment/${workspaceId}/${id}/payment`,
  },

  // ── Visiting fees (doctor-owned, per workspace) ───────────────────────────
  VISITING_FEE: {
    MY: "/visiting-fee/me",
    DOCTOR: (doctorId: string) => `/visiting-fee/doctor/${doctorId}`,
  },

  // ── Revenue share (institution default + per-doctor overrides) ────────────
  REVENUE_SHARE: {
    GET: "/revenue-share",
    SET_DEFAULT: "/revenue-share",
    SET_OVERRIDE: (doctorId: string) => `/revenue-share/doctor/${doctorId}`,
    REMOVE_OVERRIDE: (doctorId: string) => `/revenue-share/doctor/${doctorId}`,
  },

  // ── Analytics ─────────────────────────────────────────────────────────────
  ANALYTICS: {
    DASHBOARD: "/analytics/dashboard",
  },

  // ── Verification ──────────────────────────────────────────────────────────
  VERIFICATION: {
    SUBMIT: "/verification/submit",
    PENDING: "/verification/pending",
    GET: (id: string) => `/verification/${id}`,
    UNDER_REVIEW: (id: string) => `/verification/${id}/under-review`,
    APPROVE: (id: string) => `/verification/${id}/approve`,
    REJECT: (id: string) => `/verification/${id}/reject`,
  },

  // ── Subscription ──────────────────────────────────────────────────────────
  SUBSCRIPTION: {
    PLANS: "/subscription/plans",
    MY_SUBSCRIPTION: "/subscription/my-subscription",
    ENTITLEMENTS: "/subscription/entitlements",
    BILLING_HISTORY: "/subscription/billing-history",
    SUBSCRIBE: "/subscription/subscribe",
    VALIDATE_VOUCHER: "/subscription/validate-voucher",
    CANCEL: "/subscription/cancel",
  },

  // ── System / feature availability ─────────────────────────────────────────
  // Public (no auth) — drives "coming soon" / disabled states in the client.
  SYSTEM: {
    AVAILABILITY: "/system/availability",
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  NOTIFICATIONS: {
    LIST: "/notifications",
    UNREAD_COUNT: "/notifications/unread-count",
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: "/notifications/read-all",
    DELETE: (id: string) => `/notifications/${id}`,
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  ADMIN: {
    STATS: "/admin/stats",
    USERS: "/admin/users",
    UPDATE_USER: (id: string) => `/admin/users/${id}`,
    DELETE_USER: (id: string) => `/admin/users/${id}`,
    PLANS: "/admin/plans",
    PLAN_CREATE: "/admin/plans",
    PLAN_UPDATE: (id: string) => `/admin/plans/${id}`,
    SET_PLAN_FEATURE: (vid: string, fid: string) =>
      `/admin/plans/${vid}/features/${fid}`,
    SET_PLAN_FEATURE_LIMIT: (vid: string, fid: string) =>
      `/admin/plans/${vid}/features/${fid}/limit`,
    FEATURES: "/admin/features",
    TOGGLE_FEATURE: (id: string) => `/admin/features/${id}/flag`,
    AUDIT_LOGS: "/admin/audit-logs",
    LOGIN_HISTORY: "/admin/login-history",
    WORKSPACES: "/admin/workspaces",
    VERIFICATIONS: "/verification/pending",
  },

  // ── Departments (institution-level) ───────────────────────────────────────
  DEPARTMENTS: {
    LIST: (workspaceId: string) => `/departments/${workspaceId}`,
  },
} as const;

// ─── Sidebar Navigation ───────────────────────────────────────────────────────

export const SIDEBAR_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
    section: "main",
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    href: "/dashboard/prescriptions",
    icon: "FileText",
    section: "main",
  },
  {
    id: "patients",
    label: "Patients",
    href: "/dashboard/patients",
    icon: "Users",
    section: "main",
  },
  {
    id: "chambers",
    label: "Chambers",
    href: "/dashboard/chambers",
    icon: "Building2",
    section: "main",
  },
  {
    id: "appointments",
    label: "Appointments",
    href: "/dashboard/appointments",
    icon: "CalendarDays",
    section: "main",
  },
  {
    id: "notifications",
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: "Bell",
    section: "main",
  },
  {
    id: "profile",
    label: "Profile",
    href: "/dashboard/profile",
    icon: "UserCircle",
    section: "account",
  },
  {
    id: "subscription",
    label: "Subscription",
    href: "/dashboard/subscription",
    icon: "CreditCard",
    section: "account",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    icon: "Settings",
    section: "account",
  },
] as const;

export const INSTITUTION_SIDEBAR_ITEMS = [
  {
    id: "institution",
    label: "Overview",
    href: "/institution",
    icon: "Building",
    section: "institution",
  },
  {
    id: "institution-doctors",
    label: "Doctors",
    href: "/institution/doctors",
    icon: "Stethoscope",
    section: "institution",
  },
  {
    id: "institution-departments",
    label: "Departments",
    href: "/institution/departments",
    icon: "Layers",
    section: "institution",
  },
  {
    id: "institution-invitations",
    label: "Invitations",
    href: "/institution/invitations",
    icon: "Mail",
    section: "institution",
  },
  {
    id: "institution-settings",
    label: "Settings",
    href: "/institution/settings",
    icon: "Settings2",
    section: "institution",
  },
] as const;

export const ADMIN_SIDEBAR_ITEMS = [
  {
    id: "admin",
    label: "Admin Dashboard",
    href: "/dashboard/admin",
    icon: "ShieldCheck",
    section: "admin",
  },
  {
    id: "admin-users",
    label: "Users",
    href: "/dashboard/admin/users",
    icon: "Users",
    section: "admin",
  },
  {
    id: "admin-verifications",
    label: "Verifications",
    href: "/dashboard/admin/verifications",
    icon: "BadgeCheck",
    section: "admin",
  },
  {
    id: "admin-workspaces",
    label: "Workspaces",
    href: "/dashboard/admin/workspaces",
    icon: "Layout",
    section: "admin",
  },
  {
    id: "admin-subscriptions",
    label: "Subscriptions",
    href: "/dashboard/admin/subscriptions",
    icon: "CreditCard",
    section: "admin",
  },
  {
    id: "admin-plans",
    label: "Plans",
    href: "/dashboard/admin/plans",
    icon: "PackageCheck",
    section: "admin",
  },
  {
    id: "admin-features",
    label: "Feature Flags",
    href: "/dashboard/admin/features",
    icon: "ToggleRight",
    section: "admin",
  },
  {
    id: "admin-audit-logs",
    label: "Audit Logs",
    href: "/dashboard/admin/audit-logs",
    icon: "ScrollText",
    section: "admin",
  },
] as const;

// ─── Medicine / Prescription Constants ────────────────────────────────────────

export const MEDICINE_TYPES = [
  { value: "TABLET", label: "Tablet" },
  { value: "CAPSULE", label: "Capsule" },
  { value: "SYRUP", label: "Syrup" },
  { value: "INJECTION", label: "Injection" },
  { value: "CREAM", label: "Cream" },
  { value: "OINTMENT", label: "Ointment" },
  { value: "LOTION", label: "Lotion" },
  { value: "GEL", label: "Gel" },
  { value: "DROPS", label: "Drops" },
  { value: "INHALER", label: "Inhaler" },
  { value: "SPRAY", label: "Spray" },
  { value: "SUPPOSITORY", label: "Suppository" },
] as const;

// ─── Finance constants ────────────────────────────────────────────────────────

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_BANKING", label: "Mobile Banking" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "ONLINE_GATEWAY", label: "Online Gateway" },
] as const;

export const FINANCE_PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom Range" },
] as const;

export const MEAL_TIMINGS = [
  { value: "BEFORE_MEAL", label: "Before Meal" },
  { value: "AFTER_MEAL", label: "After Meal" },
  { value: "WITH_MEAL", label: "With Meal" },
  { value: "EMPTY_STOMACH", label: "Empty Stomach" },
] as const;

// ─── Prescription rendering settings (Settings → Prescription) ────────────────

export const PRESCRIPTION_LANGUAGES = [
  { value: "ENGLISH", label: "English", sample: "After Meal" },
  { value: "BANGLA", label: "বাংলা", sample: "খাবার পরে" },
] as const;

export const PRESCRIPTION_DESIGN_TEMPLATES = [
  {
    value: "DEFAULT",
    name: "Classic",
    description: "The original Presciya layout — familiar and print-tested.",
  },
  {
    value: "MODERN_CLINICAL",
    name: "Modern Clinical",
    description: "Modern medical SaaS with strong hierarchy and a patient card.",
  },
  {
    value: "MINIMAL_PROFESSIONAL",
    name: "Minimal Professional",
    description: "Typography-focused, airy and premium. Great for few medicines.",
  },
  {
    value: "MODERN_MEDICAL",
    name: "Modern Medical",
    description: "Structured sections built for scanning long medicine lists.",
  },
  {
    value: "ELEGANT_COMPACT",
    name: "Elegant Compact",
    description: "Efficient vertical space for high medicine counts.",
  },
] as const;

export const USAGE_TYPES = [
  { value: "DAILY", label: "Daily" },
  { value: "TOPICAL", label: "Topical / Apply" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "INTERVAL", label: "Every N Days" },
  { value: "CUSTOM", label: "Custom Schedule" },
] as const;

export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

// ─── Patient Constants ────────────────────────────────────────────────────────

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
] as const;

export const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;

// ─── UI Config ────────────────────────────────────────────────────────────────

export const UI_CONFIG = {
  SIDEBAR_WIDTH: 260,
  SIDEBAR_COLLAPSED_WIDTH: 72,
  NAVBAR_HEIGHT: 64,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  PAGE_LIMIT: 20,
} as const;

export const STATUS_COLORS = {
  success: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
  warning: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30",
  error: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30",
  info: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
} as const;

export const VERIFICATION_STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  UNDER_REVIEW: { label: "Under Review", color: "text-blue-600 bg-blue-50 border-blue-200" },
  APPROVED: { label: "Approved", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  REJECTED: { label: "Rejected", color: "text-red-600 bg-red-50 border-red-200" },
} as const;

export const APPOINTMENT_STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "text-amber-600 bg-amber-50" },
  CONFIRMED: { label: "Confirmed", color: "text-blue-600 bg-blue-50" },
  RUNNING: { label: "Running", color: "text-amber-600 bg-amber-50" },
  COMPLETED: { label: "Completed", color: "text-emerald-600 bg-emerald-50" },
  CANCELLED: { label: "Cancelled", color: "text-red-600 bg-red-50" },
  NO_SHOW: { label: "No Show", color: "text-gray-600 bg-gray-50" },
} as const;

export const APPOINTMENT_PAYMENT_STATUS_CONFIG = {
  PENDING: { label: "Payment Pending", color: "text-amber-700 bg-amber-50 dark:bg-amber-950/30" },
  PAID: { label: "Paid", color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30" },
  FREE: { label: "Free", color: "text-primary bg-primary/10" },
  CANCELLED: { label: "Cancelled", color: "text-red-700 bg-red-50 dark:bg-red-950/30" },
  REFUNDED: { label: "Refunded", color: "text-purple-700 bg-purple-50 dark:bg-purple-950/30" },
} as const;

// Prescription eligibility: PAID and FREE visits allow a prescription.
export const isAppointmentEligibleForPrescription = (
  status?: string | null,
): boolean => status === "PAID" || status === "FREE";
