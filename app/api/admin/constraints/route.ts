import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAnyRole } from '@/lib/auth/permissions';

// POST /api/admin/constraints
export async function POST(request: NextRequest) {
  try {
    const user = await requireAnyRole(request, ['super_admin', 'product_manager']);

    const supabase = createClient();
    const body = await request.json();

    const {
      productId,
      placementType,
      side = 'front', // Default to front for backward compatibility
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
      isEnabled = true,
      // New green area coordinates
      detectedAreaX,
      detectedAreaY,
      detectedAreaWidth,
      detectedAreaHeight,
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
      return NextResponse.json({ error: 'Invalid placement type' }, { status: 400 });
    }

    // Validate side
    if (!['front', 'back'].includes(side)) {
      return NextResponse.json(
        { error: 'Invalid side. Must be "front" or "back"' },
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

    // Check if constraint already exists for this product, placement type, and side
    const { data: existingConstraint } = await supabase
      .from('placement_constraints')
      .select('id')
      .eq('item_id', productId)
      .eq('placement_type', placementType)
      .eq('side', side)
      .single();

    let constraint, constraintError;

    if (existingConstraint) {
      // Update existing constraint
      const { data: updatedConstraint, error: updateError } = await supabase
        .from('placement_constraints')
        .update({
          side: side,
          constraint_image_url: constraintImageUrl,
          detected_area_pixels: detectedAreaPixels,
          detected_area_percentage: detectedAreaPercentage,
          detected_area_x: detectedAreaX,
          detected_area_y: detectedAreaY,
          detected_area_width: detectedAreaWidth,
          detected_area_height: detectedAreaHeight,
          min_logo_width: minLogoWidth,
          min_logo_height: minLogoHeight,
          max_logo_width: maxLogoWidth,
          max_logo_height: maxLogoHeight,
          default_x_position: defaultXPosition,
          default_y_position: defaultYPosition,
          guidelines_text: guidelinesText,
          pattern_settings: patternSettings,
          is_validated: detectedAreaPixels > 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConstraint.id)
        .select()
        .single();

      constraint = updatedConstraint;
      constraintError = updateError;
    } else {
      // Create new constraint
      const { data: newConstraint, error: insertError } = await supabase
        .from('placement_constraints')
        .insert({
          item_id: productId,
          placement_type: placementType,
          side: side,
          constraint_image_url: constraintImageUrl,
          detected_area_pixels: detectedAreaPixels,
          detected_area_percentage: detectedAreaPercentage,
          detected_area_x: detectedAreaX,
          detected_area_y: detectedAreaY,
          detected_area_width: detectedAreaWidth,
          detected_area_height: detectedAreaHeight,
          min_logo_width: minLogoWidth,
          min_logo_height: minLogoHeight,
          max_logo_width: maxLogoWidth,
          max_logo_height: maxLogoHeight,
          default_x_position: defaultXPosition,
          default_y_position: defaultYPosition,
          guidelines_text: guidelinesText,
          pattern_settings: patternSettings,
          is_validated: detectedAreaPixels > 0,
        })
        .select()
        .single();

      constraint = newConstraint;
      constraintError = insertError;
    }

    if (constraintError) {
      console.error('Database error:', constraintError);
      return NextResponse.json(
        { error: `Failed to ${existingConstraint ? 'update' : 'create'} constraint` },
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
          updated_by: user.userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (updateError) {
        console.error('Error updating product:', updateError);
      }
    }

    // Log the action
    await supabase.from('audit_log').insert({
      admin_user_id: user.userId,
      action: existingConstraint ? 'UPDATE' : 'CREATE',
      entity_type: 'placement_constraint',
      entity_id: constraint.id,
      new_values: constraint,
      ip_address:
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      constraint,
      message: `Constraint ${existingConstraint ? 'updated' : 'created'} successfully`,
      action: existingConstraint ? 'updated' : 'created',
    });
  } catch (error) {
    console.error('Create constraint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
