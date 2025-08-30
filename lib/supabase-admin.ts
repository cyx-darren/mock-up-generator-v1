import { supabaseAdmin } from '@/lib/supabase'
import { Database } from '@/types/database'

type AdminUser = Database['public']['Tables']['admin_users']['Row']
type GiftItem = Database['public']['Tables']['gift_items']['Row']
type PlacementConstraint = Database['public']['Tables']['placement_constraints']['Row']

// Admin User Management
export async function createAdminUser(userData: {
  email: string
  password_hash: string
  role?: 'super_admin' | 'product_manager' | 'viewer'
}) {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .insert([userData])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAdminUser(id: string) {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getAdminUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) throw error
  return data
}

export async function updateAdminUser(id: string, updates: Partial<AdminUser>) {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Gift Items Management
export async function createGiftItem(itemData: Database['public']['Tables']['gift_items']['Insert']) {
  const { data, error } = await supabaseAdmin
    .from('gift_items')
    .insert([itemData])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getGiftItems(filters?: {
  status?: 'draft' | 'active' | 'archived'
  category?: string
  limit?: number
  offset?: number
}) {
  let query = supabaseAdmin
    .from('gift_items')
    .select(`
      *,
      placement_constraints (
        id,
        placement_type,
        constraint_image_url,
        is_validated,
        guidelines_text
      )
    `)

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getGiftItem(id: string) {
  const { data, error } = await supabaseAdmin
    .from('gift_items')
    .select(`
      *,
      placement_constraints (*),
      created_by_user:admin_users!gift_items_created_by_fkey (
        id,
        email,
        role
      ),
      updated_by_user:admin_users!gift_items_updated_by_fkey (
        id,
        email,
        role
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function updateGiftItem(id: string, updates: Partial<GiftItem>) {
  const { data, error } = await supabaseAdmin
    .from('gift_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteGiftItem(id: string) {
  // Soft delete by setting status to archived
  const { data, error } = await supabaseAdmin
    .from('gift_items')
    .update({ status: 'archived', is_active: false })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Placement Constraints Management
export async function createPlacementConstraint(
  constraintData: Database['public']['Tables']['placement_constraints']['Insert']
) {
  const { data, error } = await supabaseAdmin
    .from('placement_constraints')
    .insert([constraintData])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePlacementConstraint(
  id: string, 
  updates: Partial<PlacementConstraint>
) {
  const { data, error } = await supabaseAdmin
    .from('placement_constraints')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getPlacementConstraints(itemId: string) {
  const { data, error } = await supabaseAdmin
    .from('placement_constraints')
    .select('*')
    .eq('item_id', itemId)
    .order('placement_type', { ascending: true })

  if (error) throw error
  return data
}

export async function deletePlacementConstraint(id: string) {
  const { data, error } = await supabaseAdmin
    .from('placement_constraints')
    .delete()
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Audit Log
export async function createAuditLogEntry(auditData: {
  admin_user_id: string
  action: string
  entity_type: string
  entity_id: string
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
}) {
  const { data, error } = await supabaseAdmin
    .from('audit_log')
    .insert([auditData])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getAuditLogs(filters?: {
  admin_user_id?: string
  entity_type?: string
  entity_id?: string
  limit?: number
  offset?: number
}) {
  let query = supabaseAdmin
    .from('audit_log')
    .select(`
      *,
      admin_user:admin_users (
        id,
        email,
        role
      )
    `)

  if (filters?.admin_user_id) {
    query = query.eq('admin_user_id', filters.admin_user_id)
  }
  if (filters?.entity_type) {
    query = query.eq('entity_type', filters.entity_type)
  }
  if (filters?.entity_id) {
    query = query.eq('entity_id', filters.entity_id)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Dashboard Statistics
export async function getDashboardStats() {
  const [itemsResult, sessionsResult, constraintsResult] = await Promise.all([
    supabaseAdmin
      .from('gift_items')
      .select('status')
      .eq('is_active', true),
    
    supabaseAdmin
      .from('mockup_sessions')
      .select('status, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    
    supabaseAdmin
      .from('placement_constraints')
      .select('is_validated')
  ])

  if (itemsResult.error) throw itemsResult.error
  if (sessionsResult.error) throw sessionsResult.error
  if (constraintsResult.error) throw constraintsResult.error

  const items = itemsResult.data || []
  const sessions = sessionsResult.data || []
  const constraints = constraintsResult.data || []

  return {
    items: {
      total: items.length,
      active: items.filter(item => item.status === 'active').length,
      draft: items.filter(item => item.status === 'draft').length,
      archived: items.filter(item => item.status === 'archived').length
    },
    sessions: {
      total: sessions.length,
      completed: sessions.filter(session => session.status === 'completed').length,
      processing: sessions.filter(session => session.status === 'processing').length,
      failed: sessions.filter(session => session.status === 'failed').length
    },
    constraints: {
      total: constraints.length,
      validated: constraints.filter(constraint => constraint.is_validated).length,
      pending: constraints.filter(constraint => !constraint.is_validated).length
    }
  }
}