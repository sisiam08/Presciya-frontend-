// src/lib/roles.ts
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
    // Institutional doctors cannot create/switch chambers via this role
  ],
  ADMIN: ["*"], // full access
} as const;
