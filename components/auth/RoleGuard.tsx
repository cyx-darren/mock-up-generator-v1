'use client';

import { useAuth } from '@/hooks/useAuth';
import { UserRole, hasPermission, canAccessResource, RolePermissions } from '@/lib/auth/roles';
import { ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface RequireRoleProps extends RoleGuardProps {
  role: UserRole;
}

interface RequireAnyRoleProps extends RoleGuardProps {
  roles: UserRole[];
}

interface RequirePermissionProps extends RoleGuardProps {
  permission: keyof RolePermissions;
}

interface RequireResourceAccessProps extends RoleGuardProps {
  resource: string;
}

// Base component that checks if user is authenticated
export function RequireAuth({ children, fallback }: RoleGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center p-4">Loading...</div>;
  }

  if (!user) {
    return fallback || <div className="text-center p-4 text-gray-500">Please log in to access this content.</div>;
  }

  return <>{children}</>;
}

// Component that requires a specific role
export function RequireRole({ role, children, fallback }: RequireRoleProps) {
  const { user } = useAuth();

  return (
    <RequireAuth fallback={fallback}>
      {user?.role === role ? children : (fallback || <UnauthorizedMessage />)}
    </RequireAuth>
  );
}

// Component that requires any of the specified roles
export function RequireAnyRole({ roles, children, fallback }: RequireAnyRoleProps) {
  const { user } = useAuth();

  return (
    <RequireAuth fallback={fallback}>
      {user && roles.includes(user.role) ? children : (fallback || <UnauthorizedMessage />)}
    </RequireAuth>
  );
}

// Component that requires a specific permission
export function RequirePermission({ permission, children, fallback }: RequirePermissionProps) {
  const { user } = useAuth();

  return (
    <RequireAuth fallback={fallback}>
      {user && hasPermission(user.role, permission) ? children : (fallback || <UnauthorizedMessage />)}
    </RequireAuth>
  );
}

// Component that requires access to a specific resource
export function RequireResourceAccess({ resource, children, fallback }: RequireResourceAccessProps) {
  const { user } = useAuth();

  return (
    <RequireAuth fallback={fallback}>
      {user && canAccessResource(user.role, resource) ? children : (fallback || <UnauthorizedMessage />)}
    </RequireAuth>
  );
}

// Higher-order component for conditional rendering
interface ConditionalRenderProps {
  condition: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ConditionalRender({ condition, children, fallback }: ConditionalRenderProps) {
  return condition ? <>{children}</> : <>{fallback || null}</>;
}

// Hook-based conditional rendering components
export function IfRole({ role, children, fallback }: RequireRoleProps) {
  const { user } = useAuth();
  return (
    <ConditionalRender 
      condition={user?.role === role} 
      fallback={fallback}
    >
      {children}
    </ConditionalRender>
  );
}

export function IfAnyRole({ roles, children, fallback }: RequireAnyRoleProps) {
  const { user } = useAuth();
  return (
    <ConditionalRender 
      condition={user ? roles.includes(user.role) : false} 
      fallback={fallback}
    >
      {children}
    </ConditionalRender>
  );
}

export function IfPermission({ permission, children, fallback }: RequirePermissionProps) {
  const { user } = useAuth();
  return (
    <ConditionalRender 
      condition={user ? hasPermission(user.role, permission) : false} 
      fallback={fallback}
    >
      {children}
    </ConditionalRender>
  );
}

export function IfResourceAccess({ resource, children, fallback }: RequireResourceAccessProps) {
  const { user } = useAuth();
  return (
    <ConditionalRender 
      condition={user ? canAccessResource(user.role, resource) : false} 
      fallback={fallback}
    >
      {children}
    </ConditionalRender>
  );
}

// Default unauthorized message component
function UnauthorizedMessage() {
  return (
    <div className="text-center p-6 bg-red-50 border border-red-200 rounded-md">
      <div className="w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-red-900 mb-1">Access Denied</h3>
      <p className="text-red-700">You don't have permission to view this content.</p>
    </div>
  );
}