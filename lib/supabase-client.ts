import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type MockupSession = Database['public']['Tables']['mockup_sessions']['Row'];

// Public Gift Items (for customer-facing catalog)
export async function getPublicGiftItems(filters?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('gift_items')
    .select(
      `
      id,
      sku,
      name,
      category,
      description,
      tags,
      base_image_url,
      thumbnail_url,
      horizontal_enabled,
      vertical_enabled,
      all_over_enabled,
      placement_constraints (
        id,
        placement_type,
        constraint_image_url,
        guidelines_text,
        min_logo_width,
        min_logo_height,
        max_logo_width,
        max_logo_height
      )
    `
    )
    .eq('status', 'active')
    .eq('is_active', true);

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%, description.ilike.%${filters.search}%`);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 12) - 1);
  }

  const { data, error } = await query.order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getPublicGiftItem(id: string) {
  const { data, error } = await supabase
    .from('gift_items')
    .select(
      `
      id,
      sku,
      name,
      category,
      description,
      tags,
      base_image_url,
      thumbnail_url,
      horizontal_enabled,
      vertical_enabled,
      all_over_enabled,
      placement_constraints (
        id,
        placement_type,
        constraint_image_url,
        guidelines_text,
        min_logo_width,
        min_logo_height,
        max_logo_width,
        max_logo_height,
        default_x_position,
        default_y_position,
        pattern_settings
      )
    `
    )
    .eq('id', id)
    .eq('status', 'active')
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return data;
}

// Get categories for filtering
export async function getCategories() {
  const { data, error } = await supabase
    .from('gift_items')
    .select('category')
    .eq('status', 'active')
    .eq('is_active', true);

  if (error) throw error;

  // Get unique categories
  const uniqueCategories = [...new Set(data?.map((item: any) => item.category) || [])];
  return uniqueCategories.sort();
}

// Mockup Sessions Management (for users)
export async function createMockupSession(sessionData: {
  item_id: string;
  original_logo_url: string;
  template_id?: string;
  session_id?: string;
  generation_params?: any;
}) {
  const { data, error } = await (supabase as any)
    .from('mockup_sessions')
    .insert([
      {
        ...sessionData,
        status: 'processing' as const,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMockupSession(id: string) {
  const { data, error } = await supabase
    .from('mockup_sessions')
    .select(
      `
      *,
      gift_item:gift_items (
        id,
        name,
        base_image_url
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateMockupSession(id: string, updates: Partial<MockupSession>) {
  const { data, error } = await (supabase as any)
    .from('mockup_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMockupSessionsBySessionId(sessionId: string) {
  const { data, error } = await supabase
    .from('mockup_sessions')
    .select(
      `
      *,
      gift_item:gift_items (
        id,
        name,
        base_image_url,
        thumbnail_url
      )
    `
    )
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Clean up expired sessions (utility function)
export async function cleanupExpiredSessions() {
  const { data, error } = await supabase
    .from('mockup_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select();

  if (error) throw error;
  return data;
}

// Upload file to Supabase Storage
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }
) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, options);

  if (error) throw error;
  return data;
}

// Get public URL for file
export async function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
}

// Delete file from storage
export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) throw error;
  return true;
}

// List files in storage bucket
export async function listFiles(
  bucket: string,
  path?: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: { column: string; order?: 'asc' | 'desc' };
  }
) {
  const { data, error } = await supabase.storage.from(bucket).list(path, options);

  if (error) throw error;
  return data;
}

// Search functionality
export async function searchGiftItems(
  query: string,
  filters?: {
    category?: string;
    limit?: number;
  }
) {
  let dbQuery = supabase
    .from('gift_items')
    .select(
      `
      id,
      sku,
      name,
      category,
      description,
      tags,
      base_image_url,
      thumbnail_url
    `
    )
    .eq('status', 'active')
    .eq('is_active', true)
    .or(`name.ilike.%${query}%, description.ilike.%${query}%, sku.ilike.%${query}%`);

  if (filters?.category) {
    dbQuery = dbQuery.eq('category', filters.category);
  }

  if (filters?.limit) {
    dbQuery = dbQuery.limit(filters.limit);
  }

  const { data, error } = await dbQuery.order('name', { ascending: true });

  if (error) throw error;
  return data;
}
