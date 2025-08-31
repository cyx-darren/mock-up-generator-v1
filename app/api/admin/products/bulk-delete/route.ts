import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAuthTokens } from '@/lib/auth/cookies';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { accessToken } = getAuthTokens(request);
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const tokenPayload = verifyAccessToken(accessToken);
    const supabase = createClient();

    // Check user permissions
    const { data: user, error: userError } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('id', tokenPayload.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid user' },
        { status: 401 }
      );
    }

    // Check if user has permission to delete products
    if (user.role !== 'super_admin' && user.role !== 'product_manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { productIds } = await request.json();

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    // Get products for audit trail
    const { data: existingProducts, error: existingError } = await supabase
      .from('gift_items')
      .select('id, name, sku')
      .in('id', productIds);

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (!existingProducts || existingProducts.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more products not found' },
        { status: 404 }
      );
    }

    // Soft delete all products
    const { error: deleteError } = await supabase
      .from('gift_items')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .in('id', productIds);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // Log audit trail for each product
    const auditPromises = existingProducts.map(product =>
      supabase
        .from('audit_log')
        .insert({
          user_id: user.id,
          action: 'product.bulk_delete',
          table_name: 'gift_items',
          record_id: product.id,
          changes: {
            deleted: {
              name: product.name,
              sku: product.sku,
            }
          },
        })
    );

    await Promise.all(auditPromises);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${existingProducts.length} product(s)`,
      deletedCount: existingProducts.length,
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}