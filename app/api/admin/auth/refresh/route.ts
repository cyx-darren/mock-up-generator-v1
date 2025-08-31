import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth/jwt';
import { getAuthTokens, AUTH_COOKIES } from '@/lib/auth/cookies';
import { getSession, updateSessionActivity } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken, sessionId } = getAuthTokens(request);

    if (!refreshToken || !sessionId) {
      return NextResponse.json(
        { error: 'Missing refresh token or session ID' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const refreshPayload = verifyRefreshToken(refreshToken);
    
    if (refreshPayload.sessionId !== sessionId) {
      return NextResponse.json(
        { error: 'Session mismatch' },
        { status: 401 }
      );
    }

    // Check session in database
    const session = await getSession(sessionId);
    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    // Get user details
    const supabase = createClient();
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('id', session.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: sessionId,
    });

    // Update session activity
    await updateSessionActivity(sessionId);

    // Create response with new access token
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    // Set new access token cookie
    response.cookies.set(AUTH_COOKIES.ACCESS_TOKEN, newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired refresh token' },
      { status: 401 }
    );
  }
}