'use client';

import { TagManager } from '@/components/ui/TagManager';

interface TagsMetadataStepProps {
  data: {
    tags: string[];
  };
  onChange: (field: string, value: any) => void;
}

const commonTags = [
  'customizable',
  'eco-friendly',
  'promotional',
  'corporate gift',
  'branded',
  'bulk order',
  'premium',
  'durable',
  'lightweight',
  'portable',
  'professional',
  'trendy',
  'practical',
  'unique',
  'high-quality',
  'affordable',
  'popular',
  'bestseller',
  'new arrival',
  'limited edition',
];

export function TagsMetadataStep({ data, onChange }: TagsMetadataStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Product Tags
        </label>
        <TagManager
          tags={data.tags}
          onChange={(tags) => onChange('tags', tags)}
          suggestions={commonTags}
          placeholder="Add tags to help categorize your product..."
          maxTags={10}
        />
        <p className="text-xs text-gray-500 mt-2">
          Tags help customers find your products and improve search functionality.
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
          🏷️ Tagging Best Practices
        </h4>
        <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
          <li>• Use descriptive, relevant keywords</li>
          <li>• Include material types (e.g., "cotton", "stainless steel")</li>
          <li>• Add use cases (e.g., "conference", "trade show")</li>
          <li>• Include target audience (e.g., "corporate", "students")</li>
          <li>• Use consistent terminology across similar products</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Current Tags ({data.tags.length}/10)
          </h4>
          {data.tags.length > 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">No tags added yet</p>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">SEO Impact</h4>
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tag Count:</span>
                <span className={data.tags.length >= 3 ? 'text-green-600' : 'text-orange-600'}>
                  {data.tags.length >= 3 ? 'Good' : 'Needs more'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Searchability:</span>
                <span className={data.tags.length >= 5 ? 'text-green-600' : 'text-orange-600'}>
                  {data.tags.length >= 5 ? 'Excellent' : 'Good'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
