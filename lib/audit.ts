import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client only on server-side
let supabase: any = null;

function getSupabaseClient() {
  if (!supabase) {
    // Only initialize on server-side where env vars are available
    if (typeof window === 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    } else {
      throw new Error('Audit logging is only available on the server-side');
    }
  }
  return supabase;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGE'
  | 'PRODUCT_CREATE'
  | 'PRODUCT_UPDATE'
  | 'PRODUCT_DELETE'
  | 'PRODUCT_DUPLICATE'
  | 'CONSTRAINT_CREATE'
  | 'CONSTRAINT_UPDATE'
  | 'CONSTRAINT_DELETE'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'ROLE_CHANGE'
  | 'BULK_IMPORT'
  | 'BULK_EXPORT'
  | 'SETTINGS_UPDATE';

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  user_email: string;
  action: AuditAction;
  resource_type?: string;
  resource_id?: string;
  resource_name?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export interface AuditFilter {
  user_id?: string;
  action?: AuditAction;
  resource_type?: string;
  resource_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export class AuditLogger {
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      const client = getSupabaseClient();
      const { error } = await client.from('audit_log').insert([
        {
          ...entry,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw error to prevent audit logging from breaking the main flow
      }
    } catch (err) {
      console.error('Audit logging error:', err);
    }
  }

  static async getAuditLogs(filter?: AuditFilter) {
    try {
      const client = getSupabaseClient();
      let query = client.from('audit_log').select('*').order('created_at', { ascending: false });

      if (filter) {
        if (filter.user_id) {
          query = query.eq('user_id', filter.user_id);
        }
        if (filter.action) {
          query = query.eq('action', filter.action);
        }
        if (filter.resource_type) {
          query = query.eq('resource_type', filter.resource_type);
        }
        if (filter.resource_id) {
          query = query.eq('resource_id', filter.resource_id);
        }
        if (filter.from_date) {
          query = query.gte('created_at', filter.from_date);
        }
        if (filter.to_date) {
          query = query.lte('created_at', filter.to_date);
        }
        if (filter.limit) {
          query = query.limit(filter.limit);
        }
        if (filter.offset) {
          query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }
  }

  static async exportAuditLogs(filter?: AuditFilter): Promise<string> {
    try {
      const logs = await this.getAuditLogs(filter);

      if (!logs || logs.length === 0) {
        return '';
      }

      // Create CSV header
      const headers = [
        'Timestamp',
        'User Email',
        'Action',
        'Resource Type',
        'Resource ID',
        'Resource Name',
        'IP Address',
        'Details',
      ];

      // Create CSV rows
      const rows = logs.map((log) => [
        log.created_at,
        log.user_email,
        log.action,
        log.resource_type || '',
        log.resource_id || '',
        log.resource_name || '',
        log.ip_address || '',
        JSON.stringify(log.details || {}),
      ]);

      // Combine headers and rows
      const csv = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      return csv;
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      throw error;
    }
  }

  static async applyRetentionPolicy(daysToKeep: number = 90): Promise<void> {
    try {
      const client = getSupabaseClient();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await client
        .from('audit_log')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to apply retention policy:', error);
      throw error;
    }
  }

  static async generateReport(
    startDate: string,
    endDate: string,
    groupBy: 'user' | 'action' | 'resource_type' = 'action'
  ) {
    try {
      const logs = await this.getAuditLogs({
        from_date: startDate,
        to_date: endDate,
      });

      if (!logs || logs.length === 0) {
        return {
          summary: {
            total_actions: 0,
            unique_users: 0,
            date_range: { start: startDate, end: endDate },
          },
          breakdown: [],
        };
      }

      // Generate summary
      const uniqueUsers = new Set(logs.map((log) => log.user_id));
      const summary = {
        total_actions: logs.length,
        unique_users: uniqueUsers.size,
        date_range: { start: startDate, end: endDate },
      };

      // Generate breakdown based on groupBy parameter
      const breakdown = new Map<string, number>();

      logs.forEach((log) => {
        let key: string;
        switch (groupBy) {
          case 'user':
            key = log.user_email;
            break;
          case 'action':
            key = log.action;
            break;
          case 'resource_type':
            key = log.resource_type || 'N/A';
            break;
          default:
            key = log.action;
        }

        breakdown.set(key, (breakdown.get(key) || 0) + 1);
      });

      // Convert to array and sort by count
      const breakdownArray = Array.from(breakdown.entries())
        .map(([key, count]) => ({ [groupBy]: key, count }))
        .sort((a, b) => b.count - a.count);

      return {
        summary,
        breakdown: breakdownArray,
      };
    } catch (error) {
      console.error('Failed to generate audit report:', error);
      throw error;
    }
  }
}

// Helper function to get client info from request
export function getClientInfo(request: Request) {
  return {
    ip_address:
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  };
}

// Middleware helper for automatic audit logging
export function withAuditLog(action: AuditAction, getDetails?: (req: any) => Record<string, any>) {
  return async function (handler: Function) {
    return async function (req: any, ...args: any[]) {
      const result = await handler(req, ...args);

      // Log the action if handler was successful
      if (result && !result.error) {
        const clientInfo = getClientInfo(req);
        const details = getDetails ? getDetails(req) : undefined;

        await AuditLogger.log({
          user_id: req.user?.id || 'system',
          user_email: req.user?.email || 'system',
          action,
          details,
          ...clientInfo,
        });
      }

      return result;
    };
  };
}
