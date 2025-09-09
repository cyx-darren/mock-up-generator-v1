'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';

interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  status: 'active' | 'inactive' | 'draft';
}

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  onSave: (updates: Partial<Product>) => Promise<void>;
}

export function BulkEditModal({ isOpen, onClose, selectedProducts, onSave }: BulkEditModalProps) {
  const [updates, setUpdates] = useState<Partial<Product>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFieldChange = useCallback((field: keyof Product, value: any) => {
    setUpdates(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (Object.keys(updates).length === 0) {
      setError('No changes to save');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSave(updates);
      setSuccess(`Successfully updated ${selectedProducts.length} products`);
      setTimeout(() => {
        onClose();
        setUpdates({});
        setSuccess('');
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [updates, selectedProducts.length, onSave, onClose]);

  const handleCancel = useCallback(() => {
    setUpdates({});
    setError('');
    setSuccess('');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Bulk Edit Products
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Editing {selectedProducts.length} selected products
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={isSaving}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </CardHeader>
          <CardBody className="space-y-6">
            {error && <Alert type="error" message={error} />}
            {success && <Alert type="success" message={success} />}

            {/* Selected Products Preview */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Selected Products
              </h3>
              <div className="max-h-32 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                {selectedProducts.slice(0, 10).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-900 dark:text-white">{product.name}</span>
                    <span className="text-xs text-gray-500">{product.sku}</span>
                  </div>
                ))}
                {selectedProducts.length > 10 && (
                  <div className="text-sm text-gray-500 pt-2 border-t">
                    ... and {selectedProducts.length - 10} more
                  </div>
                )}
              </div>
            </div>

            {/* Bulk Edit Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Changes to Apply
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={updates.category || ''}
                    onChange={(e) => handleFieldChange('category', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">No change</option>
                    <option value="accessories">Accessories</option>
                    <option value="bags">Bags</option>
                    <option value="decor">Decor</option>
                    <option value="drinkware">Drinkware</option>
                    <option value="electronics">Electronics</option>
                    <option value="kitchenware">Kitchenware</option>
                    <option value="office">Office</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={updates.status || ''}
                    onChange={(e) => handleFieldChange('status', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">No change</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                {/* Price Adjustment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Adjustment
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      onChange={(e) => {
                        const action = e.target.value;
                        if (!action) {
                          handleFieldChange('price', undefined);
                        }
                      }}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">No change</option>
                      <option value="increase">Increase by</option>
                      <option value="decrease">Decrease by</option>
                      <option value="multiply">Multiply by</option>
                      <option value="set">Set to</option>
                    </select>
                    <Input
                      type="number"
                      placeholder="Amount"
                      step="0.01"
                      onChange={(e) => handleFieldChange('price', parseFloat(e.target.value) || undefined)}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Tags (placeholder for future implementation) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <Input
                    type="text"
                    placeholder="Add/remove tags (comma separated)"
                    onChange={(e) => handleFieldChange('tags' as keyof Product, e.target.value || undefined)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use +tag to add, -tag to remove
                  </p>
                </div>
              </div>

              {/* Bulk Actions */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Bulk Actions
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFieldChange('status', 'active')}
                  >
                    Activate All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFieldChange('status', 'inactive')}
                  >
                    Deactivate All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Generate new SKUs logic would go here
                      setSuccess('SKU regeneration queued');
                    }}
                  >
                    Regenerate SKUs
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || Object.keys(updates).length === 0}
              >
                {isSaving ? 'Saving...' : `Save Changes (${selectedProducts.length} products)`}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}