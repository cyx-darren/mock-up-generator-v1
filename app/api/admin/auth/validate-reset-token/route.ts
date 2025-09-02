import { NextRequest, NextResponse } from 'next/server';
import { validateResetToken } from '@/lib/auth/reset-token';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Reset token is required' }, { status: 400 });
    }

    const { isValid } = await validateResetToken(token);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Token is valid',
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
