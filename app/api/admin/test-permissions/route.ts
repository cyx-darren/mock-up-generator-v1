import { NextRequest, NextResponse } from 'next/server';
import { withPermission, withRole, requireAnyRole } from '@/lib/auth/permissions';

// Example endpoint that requires 'canViewProducts' permission
export const GET = withPermission('canViewProducts', async (request, user) => {
  return NextResponse.json({
    success: true,
    message: 'You have permission to view products',
    user: {
      id: user.userId,
      email: user.email,
      role: user.role,
    },
    permissions: 'canViewProducts',
  });
});

// Example endpoint that requires super_admin role
export const POST = withRole('super_admin', async (request, user) => {
  const body = await request.json();

  return NextResponse.json({
    success: true,
    message: 'Super admin action performed',
    user: {
      id: user.userId,
      email: user.email,
      role: user.role,
    },
    action: body.action || 'test_action',
  });
});

// Example endpoint that requires either super_admin or product_manager role
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAnyRole(request, ['super_admin', 'product_manager']);
    const body = await request.json();

    return NextResponse.json({
      success: true,
      message: 'Product management action performed',
      user: {
        id: user.userId,
        email: user.email,
        role: user.role,
      },
      allowedRoles: ['super_admin', 'product_manager'],
      action: body.action || 'update_product',
    });
  } catch (error: any) {
    const status = error.name === 'AuthenticationError' ? 401 : 403;
    return NextResponse.json({ error: error.message }, { status });
  }
}
