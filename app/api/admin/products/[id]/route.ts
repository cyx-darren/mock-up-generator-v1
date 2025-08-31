import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAuthTokens } from '@/lib/auth/cookies';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
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

    // Check if user has permission to read products
    if (user.role !== 'super_admin' && user.role !== 'product_manager' && user.role !== 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Fetch product
    const { data: product, error: productError } = await supabase
      .from('gift_items')
      .select('*')
      .eq('id', params.id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      product,
    });

  } catch (error) {
    console.error('Product fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
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

    // Check if user has permission to update products
    if (user.role !== 'super_admin' && user.role !== 'product_manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get existing product for audit trail
    const { data: existingProduct, error: existingError } = await supabase
      .from('gift_items')
      .select('*')
      .eq('id', params.id)
      .single();

    if (existingError || !existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      price,
      sku,
      status,
      tags,
      thumbnail_url,
      primary_image_url,
      additional_images,
    } = body;

    // Validate required fields
    if (!name || !description || !category) {
      return NextResponse.json(
        { error: 'Name, description, and category are required' },
        { status: 400 }
      );
    }

    // Check for duplicate SKU if changed
    if (sku && sku !== existingProduct.sku) {
      const { data: duplicateProduct } = await supabase
        .from('gift_items')
        .select('id')
        .eq('sku', sku)
        .neq('id', params.id)
        .single();

      if (duplicateProduct) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        );
      }
    }

    // Update product
    const updates = {
      name,
      description,
      category,
      price: price || 0,
      sku: sku || existingProduct.sku,
      status: status || existingProduct.status,
      tags: tags || existingProduct.tags,
      thumbnail_url,
      primary_image_url,
      additional_images: additional_images || existingProduct.additional_images,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data: product, error: updateError } = await supabase
      .from('gift_items')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    // Log audit trail
    const changes: any = {};
    Object.keys(updates).forEach(key => {
      if (key === 'updated_by' || key === 'updated_at') return;
      if (JSON.stringify(existingProduct[key]) !== JSON.stringify(updates[key])) {
        changes[key] = {
          from: existingProduct[key],
          to: updates[key],
        };
      }
    });

    if (Object.keys(changes).length > 0) {
      await supabase
        .from('audit_log')
        .insert({
          user_id: user.id,
          action: 'product.update',
          table_name: 'gift_items',
          record_id: params.id,
          changes,
        });
    }

    return NextResponse.json({
      success: true,
      product,
    });

  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
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

    // Get product for audit trail
    const { data: existingProduct, error: existingError } = await supabase
      .from('gift_items')
      .select('*')
      .eq('id', params.id)
      .single();

    if (existingError || !existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Soft delete (mark as deleted rather than actual deletion)
    const { error: deleteError } = await supabase
      .from('gift_items')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', params.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        user_id: user.id,
        action: 'product.delete',
        table_name: 'gift_items',
        record_id: params.id,
        changes: {
          deleted: {
            name: existingProduct.name,
            sku: existingProduct.sku,
          }
        },
      });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });

  } catch (error) {
    console.error('Product deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}