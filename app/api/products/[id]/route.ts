import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createClient();
    const productId = (await params).id;

    // Validate product ID format (basic UUID check)
    if (!productId || productId.length < 32) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from('gift_items')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      console.error('Product fetch error:', productError);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch placement constraints for this product
    const { data: constraints, error: constraintsError } = await supabase
      .from('placement_constraints')
      .select('*')
      .eq('item_id', productId);

    if (constraintsError) {
      console.error('Constraints fetch error:', constraintsError);
      // Don't fail the request if constraints can't be loaded
    }

    // Temporarily add dual-sided support for testing (for ALL products)
    product.has_back_printing = true;
    product.back_image_url = product.primary_image_url || product.base_image_url;

    // Return product with constraints
    return NextResponse.json({
      product,
      constraints: constraints || [],
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
