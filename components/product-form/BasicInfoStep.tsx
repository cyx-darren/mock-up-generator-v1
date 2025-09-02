'use client';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface BasicInfoStepProps {
  data: {
    name: string;
    category: string;
    sku: string;
    price: string;
    status: string;
  };
  onChange: (field: string, value: string) => void;
  onGenerateSku: () => void;
  isGeneratingSku?: boolean;
}

const categories = [
  { value: 'apparel', label: 'Apparel' },
  { value: 'bags', label: 'Bags' },
  { value: 'drinkware', label: 'Drinkware' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'office', label: 'Office Supplies' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'wellness', label: 'Health & Wellness' },
  { value: 'other', label: 'Other' },
];

export function BasicInfoStep({
  data,
  onChange,
  onGenerateSku,
  isGeneratingSku = false,
}: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Product Name *
          </label>
          <Input
            type="text"
            value={data.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="Enter product name"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Choose a clear, descriptive name for your product
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category *
          </label>
          <select
            value={data.category}
            onChange={(e) => onChange('category', e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            SKU
          </label>
          <div className="flex space-x-2">
            <Input
              type="text"
              value={data.sku}
              onChange={(e) => onChange('sku', e.target.value)}
              placeholder="Product SKU"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={onGenerateSku}
              disabled={isGeneratingSku || !data.name || !data.category}
              className="whitespace-nowrap"
            >
              {isGeneratingSku ? 'Generating...' : 'Generate'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Leave blank to auto-generate, or enter a custom SKU
          </p>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Price ($)
          </label>
          <Input
            type="number"
            value={data.price}
            onChange={(e) => onChange('price', e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            value={data.status}
            onChange={(e) => onChange('status', e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Set to inactive to save as draft</p>
        </div>
      </div>
    </div>
  );
}
