import { NextRequest, NextResponse } from 'next/server';
import { AuditLogger, getClientInfo } from '@/lib/audit';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'list': {
        const logs = await AuditLogger.getAuditLogs(body.filter);
        return NextResponse.json({ logs });
      }

      case 'export': {
        const csv = await AuditLogger.exportAuditLogs(body.filter);
        return NextResponse.json({ csv });
      }

      case 'report': {
        const report = await AuditLogger.generateReport(body.startDate, body.endDate, body.groupBy);
        return NextResponse.json(report);
      }

      case 'retention': {
        // Only super_admin can manage retention policy
        if (adminUser.role !== 'super_admin') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await AuditLogger.applyRetentionPolicy(body.daysToKeep);

        // Log the retention policy application
        const clientInfo = getClientInfo(request);
        await AuditLogger.log({
          user_id: session.user.id,
          user_email: session.user.email!,
          action: 'SETTINGS_UPDATE',
          resource_type: 'audit_retention',
          details: { daysToKeep: body.daysToKeep },
          ...clientInfo,
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Audit API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
