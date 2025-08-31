import { NextRequest } from 'next/server';
import { withPermission } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';

export const POST = withPermission('canCreateProducts', async (request: NextRequest, user, params: { id: string }) => {
  try {
    const supabase = createClient();
    const { id } = await params;
    
    // Get the original product
    const { data: originalProduct, error: fetchError } = await supabase
      .from('gift_items')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching product:', fetchError);
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!originalProduct) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate a unique SKU for the duplicate
    const timestamp = Date.now();
    const duplicateSku = `${originalProduct.sku}-COPY-${timestamp}`;
    
    // Create the duplicate product
    const duplicateProduct = {
      name: `${originalProduct.name} (Copy)`,
      description: originalProduct.description,
      sku: duplicateSku,
      category: originalProduct.category,
      price: originalProduct.price || 0,
      status: 'inactive', // Set duplicates as inactive by default
      tags: originalProduct.tags || [],
      thumbnail_url: originalProduct.thumbnail_url,
      primary_image_url: originalProduct.primary_image_url,
      base_image_url: originalProduct.base_image_url || originalProduct.primary_image_url || originalProduct.thumbnail_url,
      additional_images: originalProduct.additional_images || [],
      created_by: user.userId,
      updated_by: user.userId,
    };

    // Insert the duplicate product
    const { data: newProduct, error: insertError } = await supabase
      .from('gift_items')
      .insert([duplicateProduct])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating duplicate product:', insertError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create duplicate product',
        details: insertError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Log the duplication activity
    const { error: logError } = await supabase
      .from('audit_log')
      .insert([{
        user_id: user.userId,
        action: 'product.duplicate',
        table_name: 'gift_items',
        record_id: newProduct.id,
        changes: {
          original_product_id: originalProduct.id,
          original_sku: originalProduct.sku,
          duplicate_sku: duplicateSku,
          duplicated: {
            name: duplicateProduct.name,
            sku: duplicateProduct.sku,
            category: duplicateProduct.category,
            status: duplicateProduct.status
          }
        },
        timestamp: new Date().toISOString(),
      }]);

    if (logError) {
      console.warn('Failed to log duplication activity:', logError);
      // Don't fail the request for logging errors
    }

    return new Response(JSON.stringify({ 
      success: true,
      product: newProduct,
      message: 'Product duplicated successfully'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error during product duplication:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred while duplicating the product'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});