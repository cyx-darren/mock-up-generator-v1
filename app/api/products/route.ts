import { NextRequest, NextResponse } from 'next/server';
import { createOptimizedClient, releaseClient } from '@/lib/database/connection-pool';
import { getOptimizedProducts, getOptimizedMetadata } from '@/lib/database/query-optimizer';
import { withCompression, CompressionPresets } from '@/lib/middleware/compression';

const getHandler = async (request: NextRequest) => {
  const supabase = await createOptimizedClient();
  
  try {
    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',').map(t => t.trim()).filter(Boolean);
    const sort = searchParams.get('sort') || 'name';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 items
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const useCache = searchParams.get('no-cache') !== 'true';

    // Run product query and metadata query in parallel for better performance
    const [productsResult, metadataResult] = await Promise.all([
      getOptimizedProducts(supabase, {
        category,
        search,
        tags,
        sort,
        limit,
        offset,
        useCache
      }),
      getOptimizedMetadata(supabase)
    ]);

    return NextResponse.json({
      ...productsResult,
      categories: metadataResult.categories.map(c => c.name),
      tags: metadataResult.tags,
      metadata: {
        lastUpdated: metadataResult.lastUpdated,
        cacheUsed: useCache
      }
    }, {
      headers: {
        'Cache-Control': useCache ? 'public, max-age=300, s-maxage=600' : 'no-cache',
        'X-Cache-Status': useCache ? 'enabled' : 'disabled'
      }
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, 
      { status: 500 }
    );
  } finally {
    releaseClient(supabase);
  }
};

// Apply compression middleware to the handler
export const GET = withCompression(CompressionPresets.api)(getHandler);
