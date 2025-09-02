import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createResetToken } from '@/lib/auth/reset-token';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = createClient();

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success to prevent email enumeration
    // Don't reveal whether the email exists in the system
    if (userError || !user) {
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, we sent a password reset link.',
      });
    }

    // Generate reset token
    const resetToken = await createResetToken(user.id);

    // In production, you would send an actual email here
    // For now, we'll log the reset URL to the console for testing
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}`;

    console.log('Password Reset URL:', resetUrl);
    console.log('Reset token for user', user.email, ':', resetToken);

    // TODO: Implement actual email sending
    // await sendResetEmail(user.email, resetUrl);

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we sent a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
