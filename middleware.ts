import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Force middleware to use Node.js runtime instead of Edge Runtime
export const runtime = 'nodejs';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { validateAndRefreshSession } from '@/lib/auth/session-manager';
import { getAuthTokens, AUTH_COOKIES } from '@/lib/auth/cookies';

// Define protected routes
const protectedRoutes = ['/admin/dashboard', '/admin/products', '/admin/settings'];
const authRoutes = ['/admin/login', '/admin/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // Get auth tokens from cookies
  const { accessToken, sessionId } = getAuthTokens(request);
  
  
  // Handle protected routes
  if (isProtectedRoute) {
    if (!accessToken || !sessionId) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Verify access token
      const tokenPayload = verifyAccessToken(accessToken);
      
      // Validate session and track activity
      const sessionValidation = await validateAndRefreshSession(sessionId);
      
      if (!sessionValidation.isValid) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        url.searchParams.set('redirect', pathname);
        url.searchParams.set('reason', sessionValidation.reason || 'session_invalid');
        
        const response = NextResponse.redirect(url);
        // Clear auth cookies
        response.cookies.delete(AUTH_COOKIES.ACCESS_TOKEN);
        response.cookies.delete(AUTH_COOKIES.REFRESH_TOKEN);
        response.cookies.delete(AUTH_COOKIES.SESSION_ID);
        return response;
      }
      
      // Session is valid, activity was automatically updated by validateAndRefreshSession
      
    } catch (error) {
      console.error('Auth middleware error:', error);
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }
  
  // Redirect to dashboard if accessing auth routes with valid token
  if (isAuthRoute && accessToken && sessionId) {
    try {
      verifyAccessToken(accessToken);
      const sessionValidation = await validateAndRefreshSession(sessionId);
      
      if (sessionValidation.isValid) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/dashboard';
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // Token invalid, allow access to auth routes
    }
  }
  
  // Add security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );
  
  return response;
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};