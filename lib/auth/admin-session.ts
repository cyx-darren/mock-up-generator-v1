import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAuthTokens } from '@/lib/auth/cookies';

interface VerifySessionResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  error?: string;
}

export async function verifyAdminSession(request: NextRequest): Promise<VerifySessionResult> {
  try {
    // Get auth tokens from cookies
    const { accessToken } = getAuthTokens(request);
    
    if (!accessToken) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Verify the access token
    const tokenPayload = verifyAccessToken(accessToken);
    const supabase = createClient();

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('id', tokenPayload.userId)
      .single();

    if (userError || !user) {
      return {
        success: false,
        error: 'Invalid user'
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}