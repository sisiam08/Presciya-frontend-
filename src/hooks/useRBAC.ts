// src/hooks/useRBAC.ts
import { useAuth } from './useAuth';
import { permissions, Role } from '@/lib/roles';

export function useRBAC() {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.role) return false;
    
    const userRole = user.role as Role;
    const allowedPermissions = permissions[userRole] as readonly string[];
    
    if (!allowedPermissions) return false;

    // Admin has access to everything
    if (allowedPermissions.includes("*")) return true;

    return allowedPermissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some((perm) => hasPermission(perm));
  };

  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every((perm) => hasPermission(perm));
  };

  return {
    role: user?.role as Role | undefined,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
