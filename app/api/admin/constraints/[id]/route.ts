import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAnyRole } from '@/lib/auth/permissions';

// PUT /api/admin/constraints/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAnyRole(request, ['super_admin', 'product_manager']);

    const supabase = createClient();
    const { id: constraintId } = await params;
    const body = await request.json();

    const {
      constraintImageUrl,
      detectedAreaPixels,
      detectedAreaPercentage,
      detectedAreaX,
      detectedAreaY,
      detectedAreaWidth,
      detectedAreaHeight,
      minLogoWidth,
      minLogoHeight,
      maxLogoWidth,
      maxLogoHeight,
      defaultXPosition,
      defaultYPosition,
      guidelinesText,
      patternSettings,
      isEnabled,
    } = body;

    // First, get the existing constraint to get the old values and verify it exists
    const { data: existingConstraint, error: fetchError } = await supabase
      .from('placement_constraints')
      .select(
        `
        *,
        gift_items(id, name)
      `
      )
      .eq('id', constraintId)
      .single();

    if (fetchError || !existingConstraint) {
      return NextResponse.json({ error: 'Constraint not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (constraintImageUrl !== undefined) updateData.constraint_image_url = constraintImageUrl;
    if (detectedAreaPixels !== undefined) updateData.detected_area_pixels = detectedAreaPixels;
    if (detectedAreaPercentage !== undefined)
      updateData.detected_area_percentage = detectedAreaPercentage;
    if (detectedAreaX !== undefined) updateData.detected_area_x = detectedAreaX;
    if (detectedAreaY !== undefined) updateData.detected_area_y = detectedAreaY;
    if (detectedAreaWidth !== undefined) updateData.detected_area_width = detectedAreaWidth;
    if (detectedAreaHeight !== undefined) updateData.detected_area_height = detectedAreaHeight;
    if (minLogoWidth !== undefined) updateData.min_logo_width = minLogoWidth;
    if (minLogoHeight !== undefined) updateData.min_logo_height = minLogoHeight;
    if (maxLogoWidth !== undefined) updateData.max_logo_width = maxLogoWidth;
    if (maxLogoHeight !== undefined) updateData.max_logo_height = maxLogoHeight;
    if (defaultXPosition !== undefined) updateData.default_x_position = defaultXPosition;
    if (defaultYPosition !== undefined) updateData.default_y_position = defaultYPosition;
    if (guidelinesText !== undefined) updateData.guidelines_text = guidelinesText;
    if (patternSettings !== undefined) updateData.pattern_settings = patternSettings;

    // Update validation status if we have detection data
    if (detectedAreaPixels !== undefined) {
      updateData.is_validated = detectedAreaPixels > 0;
    }

    // Update the constraint
    const { data: updatedConstraint, error: updateError } = await supabase
      .from('placement_constraints')
      .update(updateData)
      .eq('id', constraintId)
      .select()
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json({ error: 'Failed to update constraint' }, { status: 500 });
    }

    // Update the product's enabled status if specified
    if (isEnabled !== undefined && existingConstraint.gift_items) {
      const productId = existingConstraint.gift_items.id;
      const placementType = existingConstraint.placement_type;
      const enableField = `${placementType}_enabled`;

      const { error: productUpdateError } = await supabase
        .from('gift_items')
        .update({
          [enableField]: isEnabled,
          updated_by: user.userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (productUpdateError) {
        console.error('Error updating product enabled status:', productUpdateError);
      }
    }

    // Log the action
    await supabase.from('audit_log').insert({
      admin_user_id: user.userId,
      action: 'UPDATE',
      entity_type: 'placement_constraint',
      entity_id: constraintId,
      old_values: existingConstraint,
      new_values: updatedConstraint,
      ip_address:
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      constraint: updatedConstraint,
      message: 'Constraint updated successfully',
    });
  } catch (error) {
    console.error('Update constraint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/constraints/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAnyRole(request, ['super_admin', 'product_manager']);

    const supabase = createClient();
    const { id: constraintId } = await params;

    // First, get the existing constraint to get the product info
    const { data: existingConstraint, error: fetchError } = await supabase
      .from('placement_constraints')
      .select(
        `
        *,
        gift_items(id, name)
      `
      )
      .eq('id', constraintId)
      .single();

    if (fetchError || !existingConstraint) {
      return NextResponse.json({ error: 'Constraint not found' }, { status: 404 });
    }

    // Delete the constraint
    const { error: deleteError } = await supabase
      .from('placement_constraints')
      .delete()
      .eq('id', constraintId);

    if (deleteError) {
      console.error('Database error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete constraint' }, { status: 500 });
    }

    // Disable the placement type on the product
    if (existingConstraint.gift_items) {
      const productId = existingConstraint.gift_items.id;
      const placementType = existingConstraint.placement_type;
      const enableField = `${placementType}_enabled`;

      const { error: productUpdateError } = await supabase
        .from('gift_items')
        .update({
          [enableField]: false,
          updated_by: user.userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (productUpdateError) {
        console.error('Error updating product:', productUpdateError);
      }
    }

    // Log the action
    await supabase.from('audit_log').insert({
      admin_user_id: user.userId,
      action: 'DELETE',
      entity_type: 'placement_constraint',
      entity_id: constraintId,
      old_values: existingConstraint,
      ip_address:
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'Constraint deleted successfully',
    });
  } catch (error) {
    console.error('Delete constraint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
