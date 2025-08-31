import { createClient } from '@/lib/supabase/server';

export interface SessionData {
  id: string;
  userId: string;
  sessionId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  lastActivity: Date;
  isActive: boolean;
}

export async function createSession(
  userId: string,
  sessionId: string,
  expiresAt: Date,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const supabase = createClient();

  // First, invalidate any existing sessions for this user
  await supabase
    .from('admin_sessions')
    .update({ is_active: false })
    .eq('user_id', userId);

  // Create new session
  const { error } = await supabase
    .from('admin_sessions')
    .insert({
      user_id: userId,
      session_id: sessionId,
      expires_at: expiresAt.toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
      last_activity: new Date().toISOString(),
      is_active: true,
    });

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    sessionId: data.session_id,
    expiresAt: new Date(data.expires_at),
    ipAddress: data.ip_address,
    userAgent: data.user_agent,
    lastActivity: new Date(data.last_activity),
    isActive: data.is_active,
  };
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('admin_sessions')
    .update({
      last_activity: new Date().toISOString(),
    })
    .eq('session_id', sessionId);

  if (error) {
    console.error('Failed to update session activity:', error);
  }
}

export async function invalidateSession(sessionId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('admin_sessions')
    .update({ is_active: false })
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to invalidate session: ${error.message}`);
  }
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('admin_sessions')
    .update({ is_active: false })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to invalidate user sessions: ${error.message}`);
  }
}

export async function cleanupExpiredSessions(): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('admin_sessions')
    .update({ is_active: false })
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Failed to cleanup expired sessions:', error);
  }
}