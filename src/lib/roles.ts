
export type Role = "MANAGER" | "INSTITUTION" | "ADMIN";

export const permissions = {
  MANAGER: [
    "prescription:create",
    "prescription:read",
    "patient:read",
    "chamber:create",
    "chamber:switch",
  ],
  INSTITUTION: [
    "prescription:create",
    "prescription:read",
    "patient:manage",
    "doctor:manage",
    "institution:settings",
    
  ],
  ADMIN: ["*"], 
} as const;
