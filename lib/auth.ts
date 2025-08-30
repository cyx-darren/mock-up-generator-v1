import { supabaseAdmin } from '@/lib/supabase';
import { getAdminUserByEmail, createAuditLogEntry } from '@/lib/supabase-admin';
import { Database } from '@/types/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const COOKIE_NAME = 'admin_token';

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'product_manager' | 'viewer';
  two_factor_enabled: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: AdminUser): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      two_factor_enabled: false,
    };
  } catch (error) {
    return null;
  }
}

export async function authenticateAdmin(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ user: AdminUser; token: string } | null> {
  try {
    const adminUser = await getAdminUserByEmail(email);

    if (!adminUser) {
      return null;
    }

    const isPasswordValid = await verifyPassword(password, adminUser.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    await (supabaseAdmin as any)
      .from('admin_users')
      .update({
        last_login: new Date().toISOString(),
      })
      .eq('id', adminUser.id);

    const user: AdminUser = {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      two_factor_enabled: adminUser.two_factor_enabled,
    };

    const token = generateToken(user);

    await createAuditLogEntry({
      admin_user_id: adminUser.id,
      action: 'login',
      entity_type: 'admin_user',
      entity_id: adminUser.id,
      new_values: { login_time: new Date().toISOString() },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return { user, token };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}
