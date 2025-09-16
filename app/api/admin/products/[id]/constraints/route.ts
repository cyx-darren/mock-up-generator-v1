import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAnyRole } from '@/lib/auth/permissions';

// GET /api/admin/products/[id]/constraints
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAnyRole(request, ['super_admin', 'product_manager']);

    const supabase = createClient();
    const { id: productId } = await params;

    // First verify the product exists
    const { data: product, error: productError } = await supabase
      .from('gift_items')
      .select('id, name')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch all constraints for this product
    const { data: constraints, error: constraintsError } = await supabase
      .from('placement_constraints')
      .select(
        `
        id,
        placement_type,
        side,
        constraint_image_url,
        detected_area_pixels,
        detected_area_percentage,
        detected_area_x,
        detected_area_y,
        detected_area_width,
        detected_area_height,
        min_logo_width,
        min_logo_height,
        max_logo_width,
        max_logo_height,
        default_x_position,
        default_y_position,
        guidelines_text,
        pattern_settings,
        is_validated,
        created_at,
        updated_at
      `
      )
      .eq('item_id', productId)
      .order('created_at', { ascending: true });

    if (constraintsError) {
      console.error('Database error:', constraintsError);
      return NextResponse.json({ error: 'Failed to fetch constraints' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      constraints: constraints || [],
    });
  } catch (error) {
    console.error('Get constraints error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
