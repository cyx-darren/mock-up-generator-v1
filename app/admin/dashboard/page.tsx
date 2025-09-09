'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { ProductListManager } from '@/components/admin/ProductListManager';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import BulkImport from '@/components/admin/BulkImport';
import BulkImageProcessor from '@/components/admin/BulkImageProcessor';

export default function AdminDashboard() {
  const { user, can, logout } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'bulk-import' | 'bulk-images' | 'audit'
  >('overview');

  // Check if user has permission to view products
  if (!can('canViewProducts')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardBody>
            <Alert
              type="error"
              message={`You don't have permission to access the product management system. Current role: ${user?.role || 'No role'}`}
            />
            <div className="mt-4 text-sm text-gray-600">
              <p>User Info:</p>
              <pre>{JSON.stringify(user, null, 2)}</pre>
              <p>Can view products: {can('canViewProducts') ? 'Yes' : 'No'}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Refresh
              </Button>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              onClick={() => setActiveTab('products')}
            >
              Products
            </button>
            {can('canCreateProducts') && (
              <button
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'bulk-import'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('bulk-import')}
              >
                Bulk Import
              </button>
            )}
            {can('canCreateProducts') && (
              <button
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'bulk-images'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('bulk-images')}
              >
                Bulk Images
              </button>
            )}
            {can('canManageAdmins') && (
              <button
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'audit'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                onClick={() => setActiveTab('audit')}
              >
                Audit Logs
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <DashboardStats refreshTrigger={refreshTrigger} />}

        {activeTab === 'products' && <ProductListManager refreshTrigger={refreshTrigger} />}

        {activeTab === 'bulk-import' && can('canCreateProducts') && (
          <BulkImport onImportComplete={() => setRefreshTrigger((prev) => prev + 1)} />
        )}

        {activeTab === 'bulk-images' && can('canCreateProducts') && (
          <BulkImageProcessor onProcessingComplete={() => setRefreshTrigger((prev) => prev + 1)} />
        )}

        {activeTab === 'audit' && can('canManageAdmins') && <AuditLogViewer />}
      </div>
    </div>
  );
}
