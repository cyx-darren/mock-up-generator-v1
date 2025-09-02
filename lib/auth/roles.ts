// Role-based access control system
export type UserRole = 'super_admin' | 'product_manager' | 'viewer';

export interface RolePermissions {
  // Product Management
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canViewProducts: boolean;
  canBulkImportProducts: boolean;

  // User Management
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canViewUsers: boolean;
  canChangeUserRoles: boolean;

  // System Settings
  canAccessSystemSettings: boolean;
  canViewAuditLogs: boolean;
  canExportData: boolean;
  canManageConstraints: boolean;

  // Dashboard & Analytics
  canViewDashboard: boolean;
  canViewAnalytics: boolean;
  canViewReports: boolean;

  // Session Management
  canManageSessions: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  super_admin: {
    // Product Management - Full access
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canViewProducts: true,
    canBulkImportProducts: true,

    // User Management - Full access
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canViewUsers: true,
    canChangeUserRoles: true,

    // System Settings - Full access
    canAccessSystemSettings: true,
    canViewAuditLogs: true,
    canExportData: true,
    canManageConstraints: true,

    // Dashboard & Analytics - Full access
    canViewDashboard: true,
    canViewAnalytics: true,
    canViewReports: true,

    // Session Management - Full access
    canManageSessions: true,
  },

  product_manager: {
    // Product Management - Full product access
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canViewProducts: true,
    canBulkImportProducts: true,

    // User Management - Limited access
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewUsers: true,
    canChangeUserRoles: false,

    // System Settings - Limited access
    canAccessSystemSettings: false,
    canViewAuditLogs: true,
    canExportData: true,
    canManageConstraints: true,

    // Dashboard & Analytics - Full access
    canViewDashboard: true,
    canViewAnalytics: true,
    canViewReports: true,

    // Session Management - Own sessions only
    canManageSessions: false,
  },

  viewer: {
    // Product Management - Read-only
    canCreateProducts: false,
    canEditProducts: false,
    canDeleteProducts: false,
    canViewProducts: true,
    canBulkImportProducts: false,

    // User Management - No access
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canViewUsers: false,
    canChangeUserRoles: false,

    // System Settings - No access
    canAccessSystemSettings: false,
    canViewAuditLogs: false,
    canExportData: false,
    canManageConstraints: false,

    // Dashboard & Analytics - Limited access
    canViewDashboard: true,
    canViewAnalytics: false,
    canViewReports: false,

    // Session Management - No access
    canManageSessions: false,
  },
};

export function getRolePermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return getRolePermissions(role)[permission];
}

export function canAccessResource(role: UserRole, resource: string): boolean {
  const permissions = getRolePermissions(role);

  switch (resource) {
    case 'products':
      return permissions.canViewProducts;
    case 'products/create':
      return permissions.canCreateProducts;
    case 'products/edit':
      return permissions.canEditProducts;
    case 'products/delete':
      return permissions.canDeleteProducts;
    case 'products/import':
      return permissions.canBulkImportProducts;

    case 'users':
      return permissions.canViewUsers;
    case 'users/create':
      return permissions.canCreateUsers;
    case 'users/edit':
      return permissions.canEditUsers;
    case 'users/delete':
      return permissions.canDeleteUsers;

    case 'settings':
      return permissions.canAccessSystemSettings;
    case 'audit-logs':
      return permissions.canViewAuditLogs;
    case 'analytics':
      return permissions.canViewAnalytics;
    case 'reports':
      return permissions.canViewReports;

    case 'dashboard':
      return permissions.canViewDashboard;

    default:
      return false;
  }
}

export function getHighestRole(roles: UserRole[]): UserRole {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    product_manager: 2,
    super_admin: 3,
  };

  return roles.reduce((highest, current) =>
    roleHierarchy[current] > roleHierarchy[highest] ? current : highest
  );
}

export function isRoleHigherThan(role1: UserRole, role2: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    product_manager: 2,
    super_admin: 3,
  };

  return roleHierarchy[role1] > roleHierarchy[role2];
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Administrator',
  product_manager: 'Product Manager',
  viewer: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: 'Full system access including user management and system settings',
  product_manager: 'Can manage products and view analytics, limited user access',
  viewer: 'Read-only access to products and basic dashboard',
};
