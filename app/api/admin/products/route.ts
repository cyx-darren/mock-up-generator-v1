import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAuthTokens } from '@/lib/auth/cookies';
import { AuditLogger, getClientInfo } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { accessToken } = getAuthTokens(request);

    if (!accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 });
    }

    // Check if user has permission to read products
    if (user.role !== 'super_admin' && user.role !== 'product_manager') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch products
    const { data: products, error: productsError } = await supabase
      .from('gift_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (productsError) {
      throw new Error(productsError.message);
    }

    return NextResponse.json({
      products: products || [],
      total: products?.length || 0,
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { accessToken } = getAuthTokens(request);

    if (!accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 });
    }

    // Check if user has permission to create products
    if (user.role !== 'super_admin' && user.role !== 'product_manager') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      price,
      sku,
      status = 'active',
      tags = [],
      thumbnail_url,
      primary_image_url,
      additional_images = [],
    } = body;

    // Validate required fields
    if (!name || !description || !category) {
      return NextResponse.json(
        { error: 'Name, description, and category are required' },
        { status: 400 }
      );
    }

    // Check for duplicate SKU if provided
    if (sku) {
      const { data: existingProduct } = await supabase
        .from('gift_items')
        .select('id')
        .eq('sku', sku)
        .single();

      if (existingProduct) {
        return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
      }
    }

    // Generate SKU if not provided
    const generatedSku =
      sku || `${category.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`;

    // Create product
    const { data: product, error: createError } = await supabase
      .from('gift_items')
      .insert({
        name,
        description,
        category,
        price: price || 0,
        sku: generatedSku,
        status,
        tags,
        thumbnail_url,
        primary_image_url,
        base_image_url: primary_image_url || thumbnail_url, // Use primary image as base image fallback
        additional_images: additional_images || [],
        // Default to horizontal placement enabled to satisfy constraint
        horizontal_enabled: true,
        vertical_enabled: false,
        all_over_enabled: false,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      throw new Error(createError.message);
    }

    // Log audit trail using the new audit system
    const clientInfo = getClientInfo(request);
    await AuditLogger.log({
      user_id: user.id,
      user_email: user.email,
      action: 'PRODUCT_CREATE',
      resource_type: 'product',
      resource_id: product.id,
      resource_name: name,
      details: {
        name,
        description,
        category,
        price,
        sku: generatedSku,
        status,
      },
      ...clientInfo,
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
