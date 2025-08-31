import { NextRequest } from 'next/server';
import { verifyAccessToken } from './jwt';
import { UserRole, canAccessResource, hasPermission, RolePermissions } from './roles';
import { getAuthTokens } from './cookies';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export async function authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    const { accessToken } = getAuthTokens(request);
    
    if (!accessToken) {
      return null;
    }

    const payload = verifyAccessToken(accessToken);
    
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role as UserRole,
      sessionId: payload.sessionId,
    };
  } catch (error) {
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await authenticateRequest(request);
  
  if (!user) {
    throw new AuthenticationError('Valid authentication token required');
  }
  
  return user;
}

export async function requireRole(request: NextRequest, requiredRole: UserRole): Promise<AuthUser> {
  const user = await requireAuth(request);
  
  if (user.role !== requiredRole) {
    throw new AuthorizationError(`Role '${requiredRole}' required`);
  }
  
  return user;
}

export async function requireAnyRole(request: NextRequest, allowedRoles: UserRole[]): Promise<AuthUser> {
  const user = await requireAuth(request);
  
  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError(`One of these roles required: ${allowedRoles.join(', ')}`);
  }
  
  return user;
}

export async function requirePermission(
  request: NextRequest, 
  permission: keyof RolePermissions
): Promise<AuthUser> {
  const user = await requireAuth(request);
  
  if (!hasPermission(user.role, permission)) {
    throw new AuthorizationError(`Permission '${permission}' required`);
  }
  
  return user;
}

export async function requireResourceAccess(
  request: NextRequest, 
  resource: string
): Promise<AuthUser> {
  const user = await requireAuth(request);
  
  if (!canAccessResource(user.role, resource)) {
    throw new AuthorizationError(`Access to '${resource}' not allowed`);
  }
  
  return user;
}

export function createPermissionChecker(user: AuthUser) {
  return {
    can: (permission: keyof RolePermissions) => hasPermission(user.role, permission),
    canAccess: (resource: string) => canAccessResource(user.role, resource),
    hasRole: (role: UserRole) => user.role === role,
    hasAnyRole: (roles: UserRole[]) => roles.includes(user.role),
  };
}

// Middleware wrapper for API routes
export function withAuth(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    try {
      const user = await requireAuth(request);
      return await handler(request, user);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (error instanceof AuthorizationError) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }
  };
}

export function withPermission(
  permission: keyof RolePermissions,
  handler: (request: NextRequest, user: AuthUser) => Promise<Response>
) {
  return async (request: NextRequest) => {
    try {
      const user = await requirePermission(request, permission);
      return await handler(request, user);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (error instanceof AuthorizationError) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }
  };
}

export function withRole(
  role: UserRole,
  handler: (request: NextRequest, user: AuthUser) => Promise<Response>
) {
  return async (request: NextRequest) => {
    try {
      const user = await requireRole(request, role);
      return await handler(request, user);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (error instanceof AuthorizationError) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }
  };
}