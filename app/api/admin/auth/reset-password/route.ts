import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateResetToken, markResetTokenAsUsed } from '@/lib/auth/reset-token';
import { hashPassword } from '@/lib/auth/password';
import { invalidateAllUserSessions } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Reset token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (!isPasswordStrong(password)) {
      return NextResponse.json(
        { error: 'Password does not meet security requirements' },
        { status: 400 }
      );
    }

    // Validate reset token
    const { isValid, userId } = await validateResetToken(token);

    if (!isValid || !userId) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get user's current password for history check
    const { data: user } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (user) {
      // Check if new password is same as current password
      const bcrypt = require('bcryptjs');
      const isSamePassword = await bcrypt.compare(password, user.password_hash);
      
      if (isSamePassword) {
        return NextResponse.json(
          { error: 'New password must be different from your current password' },
          { status: 400 }
        );
      }
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user's password
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error('Failed to update password');
    }

    // Mark reset token as used
    await markResetTokenAsUsed(token);

    // Invalidate all existing sessions for security
    await invalidateAllUserSessions(userId);

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function isPasswordStrong(password: string): boolean {
  if (password.length < 8) return false;
  
  let score = 0;
  
  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  // Pattern checks
  if (!/(.)\1{2,}/.test(password)) score++; // No repeating characters
  if (!/123|abc|qwe/i.test(password)) score++; // No common sequences
  
  return score >= 5;
}