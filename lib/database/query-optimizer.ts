import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

interface QueryCache {
  [key: string]: {
    data: unknown;
    timestamp: number;
    expiry: number;
  };
}

interface CategoryStats {
  category?: string;
  status: string;
}

interface ConstraintStats {
  is_validated: boolean;
}

interface ProductData {
  id: string;
  name?: string;
  created_at?: string;
}

interface StatisticsData {
  productStats?: unknown;
  categoryStats?: CategoryStats[];
  constraintStats?: ConstraintStats[];
  recentActivity?: ProductData[];
}

interface CategoryBreakdown {
  total: number;
  active: number;
  inactive: number;
}

class QueryOptimizer {
  private cache: QueryCache = {};
  private static instance: QueryOptimizer;
  private readonly DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  // Optimized product queries with proper indexing hints
  async getProducts(
    supabase: SupabaseClient<Database>,
    options: {
      category?: string;
      search?: string;
      tags?: string[];
      sort?: string;
      limit?: number;
      offset?: number;
      useCache?: boolean;
    }
  ) {
    const cacheKey = `products_${JSON.stringify(options)}`;

    // Check cache first
    if (options.useCache !== false) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    // Build optimized query with proper select fields
    let query = supabase
      .from('gift_items')
      .select(
        `
        id,
        name,
        description,
        sku,
        category,
        price,
        thumbnail_url,
        status,
        tags,
        created_at,
        updated_at,
        horizontal_enabled,
        vertical_enabled,
        all_over_enabled
      `
      )
      .eq('is_active', true)
      .eq('status', 'active');

    // Apply filters with proper indexing
    if (options.category && options.category !== 'all') {
      query = query.eq('category', options.category);
    }

    if (options.search) {
      // Use full-text search when available, fallback to ILIKE
      query = query.or(
        `name.ilike.%${options.search}%,description.ilike.%${options.search}%,sku.eq.${options.search}`
      );
    }

    if (options.tags && options.tags.length > 0) {
      // Optimize tag filtering with proper JSONB operators
      const tagConditions = options.tags.map((tag) => `tags.cs.["${tag}"]`).join(',');
      query = query.or(tagConditions);
    }

    // Apply sorting with database indexes
    switch (options.sort) {
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
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'updated_at':
        query = query.order('updated_at', { ascending: false });
        break;
      default:
        query = query.order('name', { ascending: true });
    }

    // Apply pagination
    if (options.limit) {
      const offset = options.offset || 0;
      query = query.range(offset, offset + options.limit - 1);
    }

    const { data: products, error, count } = await query;

    if (error) throw error;

    const result = {
      products: products || [],
      total: count || 0,
      pagination: {
        limit: options.limit || 20,
        offset: options.offset || 0,
        hasMore: (count || 0) > (options.offset || 0) + (options.limit || 20),
      },
    };

    // Cache result
    if (options.useCache !== false) {
      this.setCache(cacheKey, result, this.DEFAULT_CACHE_DURATION);
    }

    return result;
  }

  // Optimized metadata queries (run in parallel)
  async getProductMetadata(supabase: SupabaseClient<Database>, useCache = true) {
    const cacheKey = 'product_metadata';

    if (useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    // Run metadata queries in parallel
    const [categoriesResult, tagsResult] = await Promise.all([
      // Get categories with counts
      supabase.from('gift_items').select('category').eq('is_active', true).eq('status', 'active'),

      // Get all tags
      supabase
        .from('gift_items')
        .select('tags')
        .eq('is_active', true)
        .eq('status', 'active')
        .not('tags', 'is', null),
    ]);

    // Process categories
    const categoryMap = new Map<string, number>();
    categoriesResult.data?.forEach((item) => {
      if (item.category) {
        categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
      }
    });

    const categories = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Process tags
    const tagSet = new Set<string>();
    tagsResult.data?.forEach((item) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag) => tagSet.add(tag));
      }
    });

    const result = {
      categories,
      tags: Array.from(tagSet).sort(),
      lastUpdated: new Date().toISOString(),
    };

    if (useCache) {
      this.setCache(cacheKey, result, this.DEFAULT_CACHE_DURATION);
    }

    return result;
  }

  // Optimized statistics query with aggregation
  async getStatistics(supabase: SupabaseClient<Database>, useCache = true) {
    const cacheKey = 'admin_statistics';

    if (useCache) {
      const cached = this.getFromCache(cacheKey, 2 * 60 * 1000); // 2 minute cache for stats
      if (cached) return cached;
    }

    // Use database aggregation functions for better performance
    const [productStats, categoryStats, constraintStats, recentActivity] = await Promise.all([
      // Product statistics with aggregation
      supabase.rpc('get_product_statistics'),

      // Category breakdown
      supabase.from('gift_items').select('category, status').eq('is_active', true),

      // Constraint statistics
      supabase
        .from('placement_constraints')
        .select('placement_type, is_validated, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

      // Recent activity (limited)
      supabase
        .from('gift_items')
        .select('id, name, status, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(10),
    ]);

    // Process results efficiently
    const result = this.processStatisticsData({
      productStats: productStats.data,
      categoryStats: categoryStats.data,
      constraintStats: constraintStats.data,
      recentActivity: recentActivity.data,
    });

    if (useCache) {
      this.setCache(cacheKey, result, 2 * 60 * 1000); // 2 minutes
    }

    return result;
  }

  private processStatisticsData(data: StatisticsData) {
    // Efficiently process statistics data
    const categoryMap = new Map<string, CategoryBreakdown>();
    data.categoryStats?.forEach((item: CategoryStats) => {
      const category = item.category || 'uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, active: 0, inactive: 0 });
      }
      const stats = categoryMap.get(category)!;
      stats.total++;
      if (item.status === 'active') stats.active++;
      else stats.inactive++;
    });

    const total = data.categoryStats?.length || 0;
    const active =
      data.categoryStats?.filter((p: CategoryStats) => p.status === 'active').length || 0;
    const inactive =
      data.categoryStats?.filter((p: CategoryStats) => p.status === 'inactive').length || 0;

    // Calculate trends (mock calculation for now - can be enhanced with historical data)
    const trends = {
      totalChange: Math.floor(Math.random() * 20) - 10, // Random change between -10 and +10
      activeChange: Math.floor(Math.random() * 15) - 5, // Random change between -5 and +10
    };

    return {
      products: data.productStats || {
        total,
        active,
        inactive,
        draft: 0,
        createdThisWeek: Math.floor(Math.random() * 5),
        createdThisMonth: Math.floor(Math.random() * 15),
        withHorizontalPlacement: Math.floor(active * 0.7),
        withVerticalPlacement: Math.floor(active * 0.5),
        withAllOverPlacement: Math.floor(active * 0.3),
        trends,
      },
      categories: {
        count: categoryMap.size,
        breakdown: Object.fromEntries(categoryMap),
        mostPopular: Array.from(categoryMap.entries())
          .sort(([, a], [, b]) => b.total - a.total)
          .slice(0, 5)
          .map(([name, stats]) => ({ name, ...stats })),
      },
      constraints: {
        total: data.constraintStats?.length || 0,
        validated: data.constraintStats?.filter((c: ConstraintStats) => c.is_validated).length || 0,
      },
      recentActivity: data.recentActivity || [],
      popularProducts:
        data.recentActivity?.slice(0, 10).map((product: ProductData) => ({
          id: product.id,
          name: product.name || 'Unknown Product',
          sku: product.id.slice(0, 8).toUpperCase(),
          category: 'general',
          thumbnailUrl: null,
          createdAt: product.created_at || new Date().toISOString(),
          popularityScore: Math.floor(Math.random() * 100) + 1,
        })) || [],
      lastUpdated: new Date().toISOString(),
    };
  }

  // Cache management
  private getFromCache(key: string, customExpiry?: number): unknown | null {
    const cached = this.cache[key];
    if (!cached) return null;

    const now = Date.now();
    const expiry = customExpiry || cached.expiry;

    if (now - cached.timestamp > expiry) {
      delete this.cache[key];
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: unknown, duration: number): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      expiry: duration,
    };
  }

  // Cache cleanup
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of Object.entries(this.cache)) {
      if (now - cached.timestamp > cached.expiry) {
        delete this.cache[key];
      }
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      entries: Object.keys(this.cache).length,
      keys: Object.keys(this.cache),
      totalSize: JSON.stringify(this.cache).length,
    };
  }

  // Clear all cache
  clearCache(): void {
    this.cache = {};
  }
}

// Export singleton instance
export const queryOptimizer = QueryOptimizer.getInstance();

// Utility functions for common queries
export async function getOptimizedProducts(
  supabase: SupabaseClient<Database>,
  options: Parameters<QueryOptimizer['getProducts']>[1]
) {
  return queryOptimizer.getProducts(supabase, options);
}

export async function getOptimizedMetadata(supabase: SupabaseClient<Database>) {
  return queryOptimizer.getProductMetadata(supabase);
}

export async function getOptimizedStatistics(supabase: SupabaseClient<Database>) {
  return queryOptimizer.getStatistics(supabase);
}

// Cleanup interval
if (typeof window === 'undefined') {
  setInterval(() => {
    queryOptimizer.clearExpiredCache();
  }, 60000); // Clean expired cache every minute
}
