import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// Session configuration
export const SESSION_CONFIG = {
  // Session timeout in minutes
  IDLE_TIMEOUT: 30, // 30 minutes of inactivity
  ABSOLUTE_TIMEOUT: 12 * 60, // 12 hours absolute maximum
  WARNING_BEFORE_TIMEOUT: 5, // Show warning 5 minutes before timeout

  // Activity tracking
  ACTIVITY_UPDATE_INTERVAL: 60, // Update activity every 60 seconds

  // Concurrent sessions
  MAX_CONCURRENT_SESSIONS: 5, // Maximum concurrent sessions per user
  ENFORCE_SINGLE_SESSION: false, // If true, only one session allowed per user
};

export interface SessionInfo {
  sessionId: string;
  userId: string;
  createdAt: Date;
  lastActivity: Date;
  expiresAt: Date;
  idleExpiresAt: Date;
  isActive: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
}

export interface SessionValidation {
  isValid: boolean;
  reason?: 'expired' | 'idle_timeout' | 'invalid' | 'concurrent_limit';
  remainingTime?: number;
  showWarning?: boolean;
}

// Calculate idle expiration time
function calculateIdleExpiration(): Date {
  return new Date(Date.now() + SESSION_CONFIG.IDLE_TIMEOUT * 60 * 1000);
}

// Calculate absolute expiration time
function calculateAbsoluteExpiration(rememberMe: boolean): Date {
  const duration = rememberMe ? 30 * 24 * 60 : SESSION_CONFIG.ABSOLUTE_TIMEOUT;
  return new Date(Date.now() + duration * 60 * 1000);
}

// Check if session is expired
export function isSessionExpired(session: SessionInfo): SessionValidation {
  const now = new Date();

  // Check absolute expiration
  if (session.expiresAt < now) {
    return {
      isValid: false,
      reason: 'expired',
    };
  }

  // Check idle timeout
  const idleTime = (now.getTime() - session.lastActivity.getTime()) / 1000 / 60; // in minutes
  if (idleTime > SESSION_CONFIG.IDLE_TIMEOUT) {
    return {
      isValid: false,
      reason: 'idle_timeout',
    };
  }

  // Calculate remaining time
  const remainingTime = Math.min(
    (session.expiresAt.getTime() - now.getTime()) / 1000 / 60,
    SESSION_CONFIG.IDLE_TIMEOUT - idleTime
  );

  // Check if warning should be shown
  const showWarning = remainingTime <= SESSION_CONFIG.WARNING_BEFORE_TIMEOUT;

  return {
    isValid: true,
    remainingTime,
    showWarning,
  };
}

// Create a new session with proper timeout handling
export async function createManagedSession(
  userId: string,
  sessionId: string,
  ipAddress?: string,
  userAgent?: string,
  rememberMe = false,
  deviceInfo?: string
): Promise<void> {
  const supabase = createClient();

  // Check concurrent sessions
  if (SESSION_CONFIG.ENFORCE_SINGLE_SESSION) {
    // Invalidate all existing sessions for single session mode
    await supabase.from('admin_sessions').update({ is_active: false }).eq('user_id', userId);
  } else {
    // Check concurrent session limit
    const { data: activeSessions } = await supabase
      .from('admin_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (activeSessions && activeSessions.length >= SESSION_CONFIG.MAX_CONCURRENT_SESSIONS) {
      // Invalidate oldest session
      const { data: oldestSession } = await supabase
        .from('admin_sessions')
        .select('session_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (oldestSession) {
        await supabase
          .from('admin_sessions')
          .update({ is_active: false })
          .eq('session_id', oldestSession.session_id);
      }
    }
  }

  // Create new session
  const now = new Date();
  const { error } = await supabase.from('admin_sessions').insert({
    user_id: userId,
    session_id: sessionId,
    expires_at: calculateAbsoluteExpiration(rememberMe).toISOString(),
    idle_expires_at: calculateIdleExpiration().toISOString(),
    ip_address: ipAddress,
    user_agent: userAgent,
    device_info: deviceInfo,
    last_activity: now.toISOString(),
    created_at: now.toISOString(),
    is_active: true,
  });

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }
}

// Validate and refresh session
export async function validateAndRefreshSession(sessionId: string): Promise<SessionValidation> {
  const supabase = createClient();

  const { data: session, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .eq('is_active', true)
    .single();

  if (error || !session) {
    return {
      isValid: false,
      reason: 'invalid',
    };
  }

  const sessionInfo: SessionInfo = {
    sessionId: session.session_id,
    userId: session.user_id,
    createdAt: new Date(session.created_at),
    lastActivity: new Date(session.last_activity),
    expiresAt: new Date(session.expires_at),
    idleExpiresAt: new Date(session.idle_expires_at || session.expires_at),
    isActive: session.is_active,
    ipAddress: session.ip_address,
    userAgent: session.user_agent,
    deviceInfo: session.device_info,
  };

  const validation = isSessionExpired(sessionInfo);

  if (!validation.isValid) {
    // Invalidate expired session
    await supabase.from('admin_sessions').update({ is_active: false }).eq('session_id', sessionId);

    return validation;
  }

  // Update activity if needed
  const timeSinceLastUpdate = (Date.now() - sessionInfo.lastActivity.getTime()) / 1000;
  if (timeSinceLastUpdate > SESSION_CONFIG.ACTIVITY_UPDATE_INTERVAL) {
    await supabase
      .from('admin_sessions')
      .update({
        last_activity: new Date().toISOString(),
        idle_expires_at: calculateIdleExpiration().toISOString(),
      })
      .eq('session_id', sessionId);
  }

  return validation;
}

// Get all active sessions for a user
export async function getUserSessions(userId: string): Promise<SessionInfo[]> {
  const supabase = createClient();

  const { data: sessions, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('last_activity', { ascending: false });

  if (error || !sessions) {
    return [];
  }

  return sessions.map((session) => ({
    sessionId: session.session_id,
    userId: session.user_id,
    createdAt: new Date(session.created_at),
    lastActivity: new Date(session.last_activity),
    expiresAt: new Date(session.expires_at),
    idleExpiresAt: new Date(session.idle_expires_at || session.expires_at),
    isActive: session.is_active,
    ipAddress: session.ip_address,
    userAgent: session.user_agent,
    deviceInfo: session.device_info,
  }));
}

// Terminate a specific session
export async function terminateSession(sessionId: string, userId?: string): Promise<void> {
  const supabase = createClient();

  let query = supabase
    .from('admin_sessions')
    .update({ is_active: false })
    .eq('session_id', sessionId);

  // Add user ID check for additional security
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { error } = await query;

  if (error) {
    throw new Error(`Failed to terminate session: ${error.message}`);
  }
}

// Terminate all sessions except current
export async function terminateOtherSessions(
  userId: string,
  currentSessionId: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('admin_sessions')
    .update({ is_active: false })
    .eq('user_id', userId)
    .neq('session_id', currentSessionId);

  if (error) {
    throw new Error(`Failed to terminate other sessions: ${error.message}`);
  }
}

// Terminate ALL sessions for a user (used during password reset)
export async function terminateAllUserSessions(userId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('admin_sessions')
    .update({ is_active: false })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to terminate all user sessions: ${error.message}`);
  }
}

// Get session statistics for admin dashboard
export async function getSessionStatistics(userId?: string) {
  const supabase = createClient();

  let query = supabase.from('admin_sessions').select('*');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: sessions, error } = await query;

  if (error || !sessions) {
    return {
      totalSessions: 0,
      activeSessions: 0,
      expiredSessions: 0,
      averageSessionDuration: 0,
    };
  }

  const activeSessions = sessions.filter((s) => s.is_active).length;
  const expiredSessions = sessions.filter((s) => !s.is_active).length;

  // Calculate average session duration
  const durations = sessions.map((s) => {
    const start = new Date(s.created_at).getTime();
    const end = s.is_active
      ? new Date(s.last_activity).getTime()
      : new Date(s.updated_at).getTime();
    return end - start;
  });

  const averageSessionDuration =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length / 1000 / 60 // in minutes
      : 0;

  return {
    totalSessions: sessions.length,
    activeSessions,
    expiredSessions,
    averageSessionDuration,
  };
}

// Cleanup expired sessions (should be run periodically)
export async function cleanupExpiredSessions(): Promise<number> {
  const supabase = createClient();

  const now = new Date().toISOString();

  // First, get count of expired sessions
  const { data: expiredSessions } = await supabase
    .from('admin_sessions')
    .select('id')
    .eq('is_active', true)
    .or(`expires_at.lt.${now},idle_expires_at.lt.${now}`);

  const count = expiredSessions?.length || 0;

  // Invalidate expired sessions
  await supabase
    .from('admin_sessions')
    .update({ is_active: false })
    .eq('is_active', true)
    .or(`expires_at.lt.${now},idle_expires_at.lt.${now}`);

  // Delete very old sessions (older than 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('admin_sessions').delete().lt('created_at', thirtyDaysAgo);

  return count;
}

// Parse device info from user agent
export function parseDeviceInfo(userAgent: string): string {
  // Simple device detection
  if (/mobile/i.test(userAgent)) {
    if (/android/i.test(userAgent)) return 'Android Mobile';
    if (/iphone/i.test(userAgent)) return 'iPhone';
    return 'Mobile Device';
  }
  if (/tablet|ipad/i.test(userAgent)) return 'Tablet';
  if (/windows/i.test(userAgent)) return 'Windows PC';
  if (/mac/i.test(userAgent)) return 'Mac';
  if (/linux/i.test(userAgent)) return 'Linux';
  return 'Unknown Device';
}
