import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAuthTokens } from '@/lib/auth/cookies';
import { AuditLogger, getClientInfo } from '@/lib/audit';

interface RollbackRequest {
  rollbackId: string;
}

interface RollbackResult {
  success: boolean;
  deleted: number;
  errors?: string[];
}

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

    // Check if user has permission to manage products
    if (user.role !== 'super_admin' && user.role !== 'product_manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { rollbackId }: RollbackRequest = await request.json();

    if (!rollbackId) {
      return NextResponse.json(
        { error: 'Rollback ID is required' },
        { status: 400 }
      );
    }

    const result: RollbackResult = {
      success: true,
      deleted: 0,
      errors: []
    };

    // Find products created in this import batch
    const { data: importedProducts, error: findError } = await supabase
      .from('gift_items')
      .select('id, name, sku')
      .eq('import_batch_id', rollbackId);

    if (findError) {
      return NextResponse.json(
        { error: 'Failed to find imported products' },
        { status: 500 }
      );
    }

    if (!importedProducts || importedProducts.length === 0) {
      return NextResponse.json(
        { error: 'No products found for this import batch' },
        { status: 404 }
      );
    }

    const productIds = importedProducts.map(p => p.id);

    // Delete products in batch
    const { error: deleteError, count } = await supabase
      .from('gift_items')
      .delete()
      .in('id', productIds);

    if (deleteError) {
      result.success = false;
      result.errors = [`Failed to delete products: ${deleteError.message}`];
      return NextResponse.json(result, { status: 500 });
    }

    result.deleted = count || 0;

    // Log rollback audit entry
    const clientInfo = getClientInfo(request);
    await AuditLogger.log({
      user_id: user.id,
      user_email: user.email,
      action: 'BULK_ROLLBACK',
      resource_type: 'product',
      details: {
        rollback_id: rollbackId,
        deleted_count: result.deleted,
        deleted_products: importedProducts.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku
        }))
      },
      ...clientInfo
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Rollback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}