import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');
    const sort = searchParams.get('sort') || 'name';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase.from('gift_items').select('*').eq('is_active', true); // Only show active products

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`
      );
    }

    // Apply tag filtering
    if (tags) {
      const tagList = tags.split(',').map((tag) => tag.trim());
      // Use contains operator to check if any of the selected tags are in the product's tags array
      // Build OR conditions for each tag using proper JSONB syntax
      const tagConditions = tagList.map((tag) => `tags.cs.["${tag}"]`).join(',');
      query = query.or(tagConditions);
    }

    // Apply sorting
    switch (sort) {
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'created_at':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popularity':
        // For now, sort by created_at as we don't have popularity metrics yet
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('name', { ascending: true });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: products, error: productsError, count } = await query;

    if (productsError) {
      throw new Error(productsError.message);
    }

    // Get unique categories for filtering
    const { data: categoriesData } = await supabase
      .from('gift_items')
      .select('category')
      .eq('is_active', true);

    const uniqueCategories = [...new Set(categoriesData?.map((item) => item.category) || [])];

    // Get unique tags for filtering
    const { data: tagsData } = await supabase
      .from('gift_items')
      .select('tags')
      .eq('is_active', true);

    const allTags = new Set<string>();
    tagsData?.forEach((item) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag: string) => allTags.add(tag));
      }
    });

    return NextResponse.json({
      products: products || [],
      total: count || 0,
      categories: uniqueCategories,
      tags: Array.from(allTags).sort(),
      pagination: {
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
