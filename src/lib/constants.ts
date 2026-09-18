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
    LIST: "/patient",
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
    PRINT: (id: string) => `/prescription/${id}/print`,
    PREVIEW: (id: string) => `/prescription/${id}/preview`,
    VERIFY: (id: string) => `/prescription/${id}/verify`,
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
    BILLING_HISTORY: "/subscription/billing-history",
    SUBSCRIBE: "/subscription/subscribe",
    VALIDATE_VOUCHER: "/subscription/validate-voucher",
    CANCEL: "/subscription/cancel",
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
    SET_PLAN_FEATURE_LIMIT: (vid: string, fid: string) =>
      `/admin/plans/${vid}/features/${fid}/limit`,
    TOGGLE_FEATURE: (id: string) => `/admin/features/${id}/flag`,
    AUDIT_LOGS: "/admin/audit-logs",
    LOGIN_HISTORY: "/admin/login-history",
    WORKSPACES: "/workspaces", // reuse workspaces list for admin
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
    id: "analytics",
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: "BarChart3",
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
    href: "/admin",
    icon: "ShieldCheck",
    section: "admin",
  },
  {
    id: "admin-users",
    label: "Users",
    href: "/admin/users",
    icon: "Users",
    section: "admin",
  },
  {
    id: "admin-verifications",
    label: "Verifications",
    href: "/admin/verifications",
    icon: "BadgeCheck",
    section: "admin",
  },
  {
    id: "admin-workspaces",
    label: "Workspaces",
    href: "/admin/workspaces",
    icon: "Layout",
    section: "admin",
  },
  {
    id: "admin-subscriptions",
    label: "Subscriptions",
    href: "/admin/subscriptions",
    icon: "CreditCard",
    section: "admin",
  },
  {
    id: "admin-plans",
    label: "Plans",
    href: "/admin/plans",
    icon: "PackageCheck",
    section: "admin",
  },
  {
    id: "admin-features",
    label: "Feature Flags",
    href: "/admin/features",
    icon: "ToggleRight",
    section: "admin",
  },
  {
    id: "admin-audit-logs",
    label: "Audit Logs",
    href: "/admin/audit-logs",
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

export const MEAL_TIMINGS = [
  { value: "BEFORE_MEAL", label: "Before Meal" },
  { value: "AFTER_MEAL", label: "After Meal" },
  { value: "WITH_MEAL", label: "With Meal" },
  { value: "EMPTY_STOMACH", label: "Empty Stomach" },
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
  SCHEDULED: { label: "Scheduled", color: "text-blue-600 bg-blue-50" },
  RUNNING: { label: "Running", color: "text-amber-600 bg-amber-50" },
  COMPLETED: { label: "Completed", color: "text-emerald-600 bg-emerald-50" },
  CANCELLED: { label: "Cancelled", color: "text-red-600 bg-red-50" },
  NO_SHOW: { label: "No Show", color: "text-gray-600 bg-gray-50" },
} as const;
