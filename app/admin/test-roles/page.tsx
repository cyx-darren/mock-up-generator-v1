'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  RequireAuth, 
  RequireRole, 
  RequireAnyRole, 
  RequirePermission, 
  IfRole, 
  IfAnyRole, 
  IfPermission 
} from '@/components/auth/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/auth/roles';

export default function TestRolesPage() {
  const { user, can, canAccess, hasRole, hasAnyRole } = useAuth();
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const testAPIEndpoint = async (method: string, endpoint: string, body?: any) => {
    setIsLoading(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [`${method} ${endpoint}`]: {
          status: response.status,
          success: response.ok,
          data
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [`${method} ${endpoint}`]: {
          status: 'error',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RequireAuth>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* User Info */}
          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-4">Role-Based Access Control Test</h1>
            {user && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="font-medium text-blue-900 mb-2">Current User</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Email:</span> {user.email}</p>
                  <p><span className="font-medium">Role:</span> {ROLE_LABELS[user.role]} ({user.role})</p>
                  <p><span className="font-medium">Description:</span> {ROLE_DESCRIPTIONS[user.role]}</p>
                </div>
              </div>
            )}
          </Card>

          {/* Permission Tests */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Permission Checks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Product Permissions</h3>
                <div className="text-sm space-y-1">
                  <p>Can view products: <span className={can('canViewProducts') ? 'text-green-600' : 'text-red-600'}>{can('canViewProducts') ? '✓' : '✗'}</span></p>
                  <p>Can create products: <span className={can('canCreateProducts') ? 'text-green-600' : 'text-red-600'}>{can('canCreateProducts') ? '✓' : '✗'}</span></p>
                  <p>Can edit products: <span className={can('canEditProducts') ? 'text-green-600' : 'text-red-600'}>{can('canEditProducts') ? '✓' : '✗'}</span></p>
                  <p>Can delete products: <span className={can('canDeleteProducts') ? 'text-green-600' : 'text-red-600'}>{can('canDeleteProducts') ? '✓' : '✗'}</span></p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Admin Permissions</h3>
                <div className="text-sm space-y-1">
                  <p>Can view users: <span className={can('canViewUsers') ? 'text-green-600' : 'text-red-600'}>{can('canViewUsers') ? '✓' : '✗'}</span></p>
                  <p>Can create users: <span className={can('canCreateUsers') ? 'text-green-600' : 'text-red-600'}>{can('canCreateUsers') ? '✓' : '✗'}</span></p>
                  <p>Can view analytics: <span className={can('canViewAnalytics') ? 'text-green-600' : 'text-red-600'}>{can('canViewAnalytics') ? '✓' : '✗'}</span></p>
                  <p>Can access settings: <span className={can('canAccessSystemSettings') ? 'text-green-600' : 'text-red-600'}>{can('canAccessSystemSettings') ? '✓' : '✗'}</span></p>
                </div>
              </div>
            </div>
          </Card>

          {/* Role-Based UI Components */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Role-Based UI Components</h2>
            
            <div className="space-y-4">
              {/* Super Admin Only */}
              <RequireRole role="super_admin" fallback={<div className="text-gray-500 italic">Super admin content hidden</div>}>
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <h4 className="font-medium text-red-900">Super Admin Only Content</h4>
                  <p className="text-sm text-red-700">This content is only visible to super administrators.</p>
                </div>
              </RequireRole>

              {/* Product Manager or Super Admin */}
              <RequireAnyRole roles={['super_admin', 'product_manager']} fallback={<div className="text-gray-500 italic">Product management content hidden</div>}>
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <h4 className="font-medium text-green-900">Product Management Content</h4>
                  <p className="text-sm text-green-700">This content is visible to product managers and super admins.</p>
                </div>
              </RequireAnyRole>

              {/* Permission-Based Content */}
              <RequirePermission permission="canViewAnalytics" fallback={<div className="text-gray-500 italic">Analytics content hidden</div>}>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h4 className="font-medium text-blue-900">Analytics Content</h4>
                  <p className="text-sm text-blue-700">This content requires analytics viewing permission.</p>
                </div>
              </RequirePermission>

              {/* Conditional Rendering Examples */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <h4 className="font-medium text-gray-900">Conditional Buttons</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  <IfPermission permission="canCreateProducts">
                    <Button size="sm" variant="outline">Create Product</Button>
                  </IfPermission>
                  <IfPermission permission="canDeleteProducts">
                    <Button size="sm" variant="outline" className="text-red-600 border-red-300">Delete Product</Button>
                  </IfPermission>
                  <IfRole role="super_admin">
                    <Button size="sm" variant="outline" className="text-purple-600 border-purple-300">Admin Panel</Button>
                  </IfRole>
                  <IfAnyRole roles={['super_admin', 'product_manager']}>
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-300">Manage</Button>
                  </IfAnyRole>
                </div>
              </div>
            </div>
          </Card>

          {/* API Endpoint Tests */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">API Endpoint Tests</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => testAPIEndpoint('GET', '/api/admin/test-permissions')}
                  disabled={isLoading}
                  size="sm"
                >
                  Test View Products (GET)
                </Button>
                <Button 
                  onClick={() => testAPIEndpoint('POST', '/api/admin/test-permissions', { action: 'test_super_admin' })}
                  disabled={isLoading}
                  size="sm"
                >
                  Test Super Admin (POST)
                </Button>
                <Button 
                  onClick={() => testAPIEndpoint('PUT', '/api/admin/test-permissions', { action: 'test_product_manager' })}
                  disabled={isLoading}
                  size="sm"
                >
                  Test Product Manager (PUT)
                </Button>
              </div>

              {Object.keys(testResults).length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Test Results:</h3>
                  <div className="space-y-2">
                    {Object.entries(testResults).map(([endpoint, result]) => (
                      <div key={endpoint} className={`p-3 rounded-md border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-sm font-medium">{endpoint}</span>
                          <span className={`text-sm font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                            {result.status}
                          </span>
                        </div>
                        <pre className="text-xs mt-2 overflow-auto">
                          {JSON.stringify(result.data || result.error, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </RequireAuth>
  );
}