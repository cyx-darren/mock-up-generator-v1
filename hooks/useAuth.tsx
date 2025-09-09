'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { UserRole, hasPermission, canAccessResource, RolePermissions } from '@/lib/auth/roles';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  lastLogin?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  can: (permission: keyof RolePermissions) => boolean;
  canAccess: (resource: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthUser() {
  const { user } = useAuth();
  return user;
}

export function usePermissions() {
  const { user, can, canAccess, hasRole, hasAnyRole } = useAuth();
  return { user, can, canAccess, hasRole, hasAnyRole };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount and periodically
  useEffect(() => {
    checkAuthStatus();

    // Check auth status every 5 minutes
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/admin/auth/me');

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
      window.location.href = '/admin/login';
    }
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  const can = (permission: keyof RolePermissions) => {
    return user ? hasPermission(user.role, permission) : false;
  };

  const canAccess = (resource: string) => {
    return user ? canAccessResource(user.role, resource) : false;
  };

  const hasRole = (role: UserRole) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    refreshAuth,
    can,
    canAccess,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Additional hooks for specific use cases
export function useRequireAuth() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/admin/login';
    }
  }, [user, isLoading]);

  return { user, isLoading };
}

export function useRequireRole(requiredRole: UserRole) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        window.location.href = '/admin/login';
      } else if (user.role !== requiredRole) {
        window.location.href = `/admin/unauthorized?reason=role_required&role=${requiredRole}`;
      }
    }
  }, [user, isLoading, requiredRole]);

  return { user, isLoading };
}

export function useRequirePermission(permission: keyof RolePermissions) {
  const { user, isLoading, can } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        window.location.href = '/admin/login';
      } else if (!can(permission)) {
        window.location.href = `/admin/unauthorized?reason=insufficient_permissions`;
      }
    }
  }, [user, isLoading, can, permission]);

  return { user, isLoading };
}
