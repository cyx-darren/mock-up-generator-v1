import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export interface ResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  isUsed: boolean;
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createResetToken(userId: string): Promise<string> {
  const supabase = createClient();
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // Invalidate any existing reset tokens for this user
  await supabase
    .from('password_reset_tokens')
    .update({ is_used: true })
    .eq('user_id', userId)
    .eq('is_used', false);

  // Create new reset token
  const { error } = await supabase.from('password_reset_tokens').insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error('Failed to create reset token');
  }

  return token;
}

export async function validateResetToken(
  token: string
): Promise<{ isValid: boolean; userId?: string }> {
  const supabase = createClient();

  const { data: resetToken, error } = await supabase
    .from('password_reset_tokens')
    .select('*')
    .eq('token', token)
    .eq('is_used', false)
    .single();

  if (error || !resetToken) {
    return { isValid: false };
  }

  // Check if token is expired
  if (new Date(resetToken.expires_at) < new Date()) {
    return { isValid: false };
  }

  return { isValid: true, userId: resetToken.user_id };
}

export async function markResetTokenAsUsed(token: string): Promise<void> {
  const supabase = createClient();

  await supabase.from('password_reset_tokens').update({ is_used: true }).eq('token', token);
}

export async function cleanupExpiredTokens(): Promise<void> {
  const supabase = createClient();

  await supabase.from('password_reset_tokens').delete().lt('expires_at', new Date().toISOString());
}
