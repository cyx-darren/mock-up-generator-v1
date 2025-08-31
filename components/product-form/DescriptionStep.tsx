'use client';

import { RichTextEditor } from '@/components/ui/RichTextEditor';

interface DescriptionStepProps {
  data: {
    description: string;
  };
  onChange: (field: string, value: string) => void;
}

export function DescriptionStep({ data, onChange }: DescriptionStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Product Description *
        </label>
        <RichTextEditor
          value={data.description}
          onChange={(value) => onChange('description', value)}
          placeholder="Enter a detailed product description..."
          minHeight="300px"
        />
        <p className="text-xs text-gray-500 mt-2">
          Use the toolbar to format your text. You can add headings, lists, and basic formatting.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          💡 Writing Tips
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Highlight key features and benefits</li>
          <li>• Include material and size information</li>
          <li>• Mention customization options</li>
          <li>• Use bullet points for easy scanning</li>
          <li>• Keep it engaging but professional</li>
        </ul>
      </div>
    </div>
  );
}