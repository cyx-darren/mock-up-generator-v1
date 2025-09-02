'use client';

import { useState, useEffect } from 'react';
import { AuditLogger, AuditFilter, AuditAction } from '@/lib/audit';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/select';
import { Card, CardBody } from '@/components/ui/Card';
import { Download, Filter, RefreshCw, FileText } from 'lucide-react';
import { format } from 'date-fns';

const AUDIT_ACTIONS: AuditAction[] = [
  'LOGIN',
  'LOGOUT',
  'PASSWORD_RESET',
  'PASSWORD_CHANGE',
  'PRODUCT_CREATE',
  'PRODUCT_UPDATE',
  'PRODUCT_DELETE',
  'PRODUCT_DUPLICATE',
  'CONSTRAINT_CREATE',
  'CONSTRAINT_UPDATE',
  'CONSTRAINT_DELETE',
  'USER_CREATE',
  'USER_UPDATE',
  'USER_DELETE',
  'ROLE_CHANGE',
  'BULK_IMPORT',
  'BULK_EXPORT',
  'SETTINGS_UPDATE',
];

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<AuditFilter>({
    limit: 50,
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', filter }),
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export', filter }),
      });

      if (response.ok) {
        const { csv } = await response.json();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const response = await fetch('/api/admin/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report',
          startDate:
            filter.from_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: filter.to_date || new Date().toISOString(),
          groupBy: 'action',
        }),
      });

      if (response.ok) {
        const report = await response.json();
        console.log('Audit Report:', report);
        // You can display this in a modal or separate component
        alert(
          `Report Generated:\nTotal Actions: ${report.summary.total_actions}\nUnique Users: ${report.summary.unique_users}`
        );
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const applyFilter = () => {
    fetchLogs();
    setShowFilters(false);
  };

  const clearFilter = () => {
    setFilter({ limit: 50 });
    fetchLogs();
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return 'text-red-600';
    if (action.includes('CREATE')) return 'text-green-600';
    if (action.includes('UPDATE')) return 'text-blue-600';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'text-purple-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Audit Logs</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm" onClick={handleGenerateReport}>
                <FileText className="w-4 h-4 mr-2" />
                Report
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {showFilters && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium mb-1 block">User Email</label>
                  <Input
                    placeholder="Filter by user email"
                    value={(filter as any).user_email || ''}
                    onChange={(e) => setFilter({ ...filter, user_email: e.target.value } as any)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Action</label>
                  <Select
                    value={filter.action || ''}
                    onChange={(e) =>
                      setFilter({ ...filter, action: e.target.value as AuditAction })
                    }
                    className="mt-1"
                  >
                    <option value="">All actions</option>
                    {AUDIT_ACTIONS.map((action) => (
                      <option key={action} value={action}>
                        {action.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Resource Type</label>
                  <Input
                    placeholder="Filter by resource type"
                    value={filter.resource_type || ''}
                    onChange={(e) => setFilter({ ...filter, resource_type: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">From Date</label>
                  <Input
                    type="datetime-local"
                    value={filter.from_date ? filter.from_date.slice(0, 16) : ''}
                    onChange={(e) => setFilter({ ...filter, from_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">To Date</label>
                  <Input
                    type="datetime-local"
                    value={filter.to_date ? filter.to_date.slice(0, 16) : ''}
                    onChange={(e) => setFilter({ ...filter, to_date: e.target.value })}
                  />
                </div>

                <div className="flex items-end gap-2">
                  <Button onClick={applyFilter} className="flex-1">
                    Apply Filter
                  </Button>
                  <Button variant="outline" onClick={clearFilter}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Timestamp</th>
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Action</th>
                    <th className="text-left p-2">Resource</th>
                    <th className="text-left p-2">Details</th>
                    <th className="text-left p-2">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-xs text-gray-600">
                        {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                      </td>
                      <td className="p-2">
                        <div className="text-sm font-medium">{log.user_email}</div>
                        <div className="text-xs text-gray-500">{log.user_id}</div>
                      </td>
                      <td className="p-2">
                        <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-2">
                        {log.resource_type && (
                          <div>
                            <div className="text-sm">{log.resource_name || log.resource_type}</div>
                            {log.resource_id && (
                              <div className="text-xs text-gray-500">{log.resource_id}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        {log.details && (
                          <details className="cursor-pointer">
                            <summary className="text-xs text-blue-600">View details</summary>
                            <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                      <td className="p-2 text-xs text-gray-600">{log.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {logs.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">No audit logs found</div>
              )}

              {loading && (
                <div className="text-center py-8 text-gray-500">Loading audit logs...</div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
