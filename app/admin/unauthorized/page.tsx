'use client';

import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Suspense } from 'react';

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'insufficient_permissions';
  const resource = searchParams.get('resource');
  const requiredRole = searchParams.get('role');

  const getErrorMessage = () => {
    switch (reason) {
      case 'insufficient_permissions':
        return 'You do not have sufficient permissions to access this resource.';
      case 'role_required':
        return `This action requires ${requiredRole} role privileges.`;
      case 'resource_denied':
        return `Access to ${resource} is restricted.`;
      default:
        return 'You are not authorized to access this page.';
    }
  };

  const getErrorTitle = () => {
    switch (reason) {
      case 'insufficient_permissions':
        return 'Access Denied';
      case 'role_required':
        return 'Higher Privileges Required';
      case 'resource_denied':
        return 'Resource Access Denied';
      default:
        return 'Unauthorized Access';
    }
  };

  const getSuggestions = () => {
    const suggestions = [
      'Contact your system administrator to request access',
      'Verify that you are logged in with the correct account',
      'Check if your role has been recently updated',
    ];

    if (requiredRole) {
      suggestions.unshift(`Request ${requiredRole} role privileges`);
    }

    return suggestions;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {getErrorTitle()}
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 mb-6">
            {getErrorMessage()}
          </p>

          {/* Additional Info */}
          {(resource || requiredRole) && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
              {resource && (
                <p className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Resource:</span> {resource}
                </p>
              )}
              {requiredRole && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Required Role:</span> {requiredRole}
                </p>
              )}
            </div>
          )}

          {/* Suggestions */}
          <div className="text-left mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">What you can do:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              {getSuggestions().map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full"
            >
              Go Back
            </Button>
            <Button
              onClick={() => window.location.href = '/admin/dashboard'}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </Card>
      </div>
    }>
      <UnauthorizedContent />
    </Suspense>
  );
}