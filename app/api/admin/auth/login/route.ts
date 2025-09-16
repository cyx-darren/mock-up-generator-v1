import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyPassword } from '@/lib/auth/password';
import { generateTokens } from '@/lib/auth/jwt';
import { setAuthCookies } from '@/lib/auth/cookies';
import { createManagedSession, parseDeviceInfo } from '@/lib/auth/session-manager';

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe = false } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const supabase = createClient();

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id, email, password_hash, role, last_login')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate tokens
    const tokens = generateTokens(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      rememberMe
    );

    // Get client info
    const ipAddress =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Create managed session with advanced features
    const deviceInfo = parseDeviceInfo(userAgent);
    await createManagedSession(
      user.id,
      tokens.sessionId,
      ipAddress,
      userAgent,
      rememberMe,
      deviceInfo
    );

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Create response with cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        lastLogin: user.last_login,
      },
    });

    setAuthCookies(response, tokens);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
