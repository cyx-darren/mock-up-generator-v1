import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAdminSession } from '@/lib/auth/admin-session';

// POST /api/admin/constraints
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAdminSession(request);
    if (!session.success) {
      return NextResponse.json({ error: session.error }, { status: 401 });
    }

    // Check if user can edit products
    const userRole = session.user.role;
    if (!['super_admin', 'product_manager'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const supabase = createClient();
    const body = await request.json();

    const {
      productId,
      placementType,
      constraintImageUrl,
      detectedAreaPixels,
      detectedAreaPercentage,
      minLogoWidth,
      minLogoHeight,
      maxLogoWidth,
      maxLogoHeight,
      defaultXPosition,
      defaultYPosition,
      guidelinesText,
      patternSettings = {},
      isEnabled = true
    } = body;

    // Validate required fields
    if (!productId || !placementType || !constraintImageUrl) {
      return NextResponse.json(
        { error: 'Product ID, placement type, and constraint image URL are required' },
        { status: 400 }
      );
    }

    // Validate placement type
    if (!['horizontal', 'vertical', 'all_over'].includes(placementType)) {
      return NextResponse.json(
        { error: 'Invalid placement type' },
        { status: 400 }
      );
    }

    // Verify the product exists
    const { data: product, error: productError } = await supabase
      .from('gift_items')
      .select('id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if constraint already exists for this product and placement type
    const { data: existingConstraint } = await supabase
      .from('placement_constraints')
      .select('id')
      .eq('item_id', productId)
      .eq('placement_type', placementType)
      .single();

    if (existingConstraint) {
      return NextResponse.json(
        { error: 'Constraint already exists for this placement type. Use PUT to update.' },
        { status: 409 }
      );
    }

    // Create the constraint
    const { data: constraint, error: constraintError } = await supabase
      .from('placement_constraints')
      .insert({
        item_id: productId,
        placement_type: placementType,
        constraint_image_url: constraintImageUrl,
        detected_area_pixels: detectedAreaPixels,
        detected_area_percentage: detectedAreaPercentage,
        min_logo_width: minLogoWidth,
        min_logo_height: minLogoHeight,
        max_logo_width: maxLogoWidth,
        max_logo_height: maxLogoHeight,
        default_x_position: defaultXPosition,
        default_y_position: defaultYPosition,
        guidelines_text: guidelinesText,
        pattern_settings: patternSettings,
        is_validated: detectedAreaPixels > 0
      })
      .select()
      .single();

    if (constraintError) {
      console.error('Database error:', constraintError);
      return NextResponse.json(
        { error: 'Failed to create constraint' },
        { status: 500 }
      );
    }

    // Update the product to enable the placement type
    const enableField = `${placementType}_enabled`;
    if (isEnabled) {
      const { error: updateError } = await supabase
        .from('gift_items')
        .update({
          [enableField]: true,
          updated_by: session.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) {
        console.error('Error updating product:', updateError);
      }
    }

    // Log the action
    await supabase.from('audit_log').insert({
      admin_user_id: session.user.id,
      action: 'CREATE',
      entity_type: 'placement_constraint',
      entity_id: constraint.id,
      new_values: constraint,
      ip_address: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
    });

    return NextResponse.json({
      success: true,
      constraint,
      message: 'Constraint created successfully'
    });

  } catch (error) {
    console.error('Create constraint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}