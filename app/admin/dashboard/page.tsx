'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { ProductListManager } from '@/components/admin/ProductListManager';

export default function AdminDashboard() {
  const { user, can, logout } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, {user?.email}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="secondary" 
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>

          {/* Enhanced Dashboard Statistics */}
          <DashboardStats refreshTrigger={refreshTrigger} />
        </div>

        {/* Enhanced Product List Management */}
        <ProductListManager refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}