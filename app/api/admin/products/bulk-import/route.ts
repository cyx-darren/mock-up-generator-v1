import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAuthTokens } from '@/lib/auth/cookies';
import { AuditLogger, getClientInfo } from '@/lib/audit';
import { ProductCSVRow } from '@/lib/bulk-import/csvTemplate';

interface BulkImportRequest {
  products: ProductCSVRow[];
}

interface BulkImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: string[];
  rollbackId?: string;
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

    const { products }: BulkImportRequest = await request.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'No products provided' }, { status: 400 });
    }

    // Generate rollback ID
    const rollbackId = `bulk_import_${Date.now()}_${user.id}`;

    const result: BulkImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [],
      rollbackId,
    };

    const importedProductIds: string[] = [];

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      try {
        // Check for duplicate SKU if provided
        if (product.sku) {
          const { data: existingProduct } = await supabase
            .from('gift_items')
            .select('id')
            .eq('sku', product.sku)
            .single();

          if (existingProduct) {
            result.errors?.push(`Row ${i + 1}: SKU '${product.sku}' already exists`);
            result.failed++;
            continue;
          }
        }

        // Generate SKU if not provided
        const generatedSku =
          product.sku ||
          `${product.category.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}-${i}`;

        // Parse additional images
        let additionalImagesArray: string[] = [];
        if (product.additional_images) {
          additionalImagesArray = product.additional_images
            .split(';')
            .map((url) => url.trim())
            .filter((url) => url.length > 0);
        }

        // Parse tags
        let tagsArray: string[] = [];
        if (product.tags) {
          tagsArray = product.tags
            .split(';')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);
        }

        // Ensure base_image_url has a value (required by database)
        const baseImageUrl =
          product.primary_image_url || product.thumbnail_url || '/placeholder-product-image.jpg'; // Default placeholder

        // Create product
        const { data: newProduct, error: createError } = await supabase
          .from('gift_items')
          .insert({
            name: product.name,
            description: product.description,
            category: product.category.toLowerCase(),
            price: product.price || 0,
            sku: generatedSku,
            status: product.status?.toLowerCase() || 'active',
            tags: tagsArray,
            thumbnail_url: product.thumbnail_url || null,
            primary_image_url: product.primary_image_url || null,
            base_image_url: baseImageUrl,
            additional_images: additionalImagesArray,
            // Default placement settings
            horizontal_enabled: true,
            vertical_enabled: false,
            all_over_enabled: false,
            // Bulk import metadata
            import_batch_id: rollbackId,
            created_by: user.id,
            updated_by: user.id,
          })
          .select()
          .single();

        if (createError) {
          result.errors?.push(`Row ${i + 1}: ${createError.message}`);
          result.failed++;
        } else {
          result.imported++;
          importedProductIds.push(newProduct.id);
        }
      } catch (error) {
        result.errors?.push(
          `Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        result.failed++;
      }
    }

    // Update success status
    result.success = result.failed === 0;

    // Log bulk import audit entry
    const clientInfo = getClientInfo(request);
    await AuditLogger.log({
      user_id: user.id,
      user_email: user.email,
      action: 'BULK_IMPORT',
      resource_type: 'product',
      details: {
        total_attempted: products.length,
        imported: result.imported,
        failed: result.failed,
        rollback_id: rollbackId,
        errors: result.errors?.slice(0, 10), // Limit errors in audit log
      },
      ...clientInfo,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
