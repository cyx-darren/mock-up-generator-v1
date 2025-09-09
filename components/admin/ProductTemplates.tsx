'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';

interface ProductTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultPrice: number;
  tags: string[];
  constraints: {
    horizontal: boolean;
    vertical: boolean;
    allOver: boolean;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    usageCount: number;
  };
}

interface ProductTemplatesProps {
  templates: ProductTemplate[];
  onCreateTemplate: (template: Omit<ProductTemplate, 'id' | 'metadata'>) => Promise<void>;
  onUseTemplate: (templateId: string, customizations?: Partial<ProductTemplate>) => Promise<void>;
  onDeleteTemplate: (templateId: string) => Promise<void>;
}

export function ProductTemplates({ 
  templates, 
  onCreateTemplate, 
  onUseTemplate, 
  onDeleteTemplate 
}: ProductTemplatesProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<ProductTemplate>>({
    name: '',
    description: '',
    category: '',
    defaultPrice: 0,
    tags: [],
    constraints: {
      horizontal: true,
      vertical: false,
      allOver: false
    }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreateTemplate = useCallback(async () => {
    if (!newTemplate.name || !newTemplate.category) {
      setError('Name and category are required');
      return;
    }

    try {
      await onCreateTemplate(newTemplate as Omit<ProductTemplate, 'id' | 'metadata'>);
      setSuccess('Template created successfully');
      setIsCreating(false);
      setNewTemplate({
        name: '',
        description: '',
        category: '',
        defaultPrice: 0,
        tags: [],
        constraints: {
          horizontal: true,
          vertical: false,
          allOver: false
        }
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create template');
    }
  }, [newTemplate, onCreateTemplate]);

  const handleUseTemplate = useCallback(async (templateId: string) => {
    try {
      await onUseTemplate(templateId);
      setSuccess('Product created from template');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to use template');
    }
  }, [onUseTemplate]);

  const popularTemplates = [...templates]
    .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      {/* Popular Templates */}
      {popularTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Popular Templates
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Most frequently used product templates
            </p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {popularTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {template.category}
                      </p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {template.metadata.usageCount} uses
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ${template.defaultPrice}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleUseTemplate(template.id)}
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Create New Template */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Product Templates
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create and manage reusable product templates
              </p>
            </div>
            <Button
              onClick={() => setIsCreating(!isCreating)}
              variant={isCreating ? "outline" : "primary"}
            >
              {isCreating ? 'Cancel' : 'New Template'}
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {isCreating && (
            <div className="space-y-4 mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Name *
                  </label>
                  <Input
                    type="text"
                    value={newTemplate.name || ''}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Office Supplies Template"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={newTemplate.category || ''}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select category</option>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Price
                  </label>
                  <Input
                    type="number"
                    value={newTemplate.defaultPrice || 0}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, defaultPrice: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <Input
                    type="text"
                    placeholder="tag1, tag2, tag3"
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                      setNewTemplate(prev => ({ ...prev, tags }));
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newTemplate.description || ''}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe this template..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Placement Options
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newTemplate.constraints?.horizontal || false}
                      onChange={(e) => setNewTemplate(prev => ({
                        ...prev,
                        constraints: { ...prev.constraints!, horizontal: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    Horizontal
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newTemplate.constraints?.vertical || false}
                      onChange={(e) => setNewTemplate(prev => ({
                        ...prev,
                        constraints: { ...prev.constraints!, vertical: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    Vertical
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newTemplate.constraints?.allOver || false}
                      onChange={(e) => setNewTemplate(prev => ({
                        ...prev,
                        constraints: { ...prev.constraints!, allOver: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    All-Over Print
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </div>
            </div>
          )}

          {/* Templates List */}
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {template.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      Used {template.metadata.usageCount} times
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {template.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm font-medium">${template.defaultPrice}</span>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {template.constraints.horizontal && <span>Horizontal</span>}
                      {template.constraints.vertical && <span>Vertical</span>}
                      {template.constraints.allOver && <span>All-Over</span>}
                    </div>
                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{template.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    Use
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Edit template logic
                      setNewTemplate(template);
                      setIsCreating(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}

            {templates.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No templates</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first product template.</p>
                <div className="mt-6">
                  <Button onClick={() => setIsCreating(true)}>
                    Create Template
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}