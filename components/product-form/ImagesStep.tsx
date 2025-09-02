'use client';

import { Input } from '@/components/ui/Input';
import { useState } from 'react';

interface ImagesStepProps {
  data: {
    thumbnail_url: string;
    primary_image_url: string;
    additional_images: string[];
  };
  onChange: (field: string, value: any) => void;
}

export function ImagesStep({ data, onChange }: ImagesStepProps) {
  const [newImageUrl, setNewImageUrl] = useState('');

  const addAdditionalImage = () => {
    if (newImageUrl.trim() && data.additional_images.length < 5) {
      onChange('additional_images', [...data.additional_images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeAdditionalImage = (index: number) => {
    onChange(
      'additional_images',
      data.additional_images.filter((_, i) => i !== index)
    );
  };

  const validateImageUrl = (url: string) => {
    return url === '' || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  return (
    <div className="space-y-6">
      {/* Primary Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Thumbnail Image URL
          </label>
          <Input
            type="url"
            value={data.thumbnail_url}
            onChange={(e) => onChange('thumbnail_url', e.target.value)}
            placeholder="https://example.com/thumbnail.jpg"
          />
          <p className="text-xs text-gray-500 mt-1">Square format recommended (1:1 ratio)</p>
          {data.thumbnail_url && !validateImageUrl(data.thumbnail_url) && (
            <p className="text-xs text-red-500 mt-1">Invalid image URL format</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Primary Image URL
          </label>
          <Input
            type="url"
            value={data.primary_image_url}
            onChange={(e) => onChange('primary_image_url', e.target.value)}
            placeholder="https://example.com/primary.jpg"
          />
          <p className="text-xs text-gray-500 mt-1">High resolution product image</p>
          {data.primary_image_url && !validateImageUrl(data.primary_image_url) && (
            <p className="text-xs text-red-500 mt-1">Invalid image URL format</p>
          )}
        </div>
      </div>

      {/* Image Previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.thumbnail_url && validateImageUrl(data.thumbnail_url) && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Thumbnail Preview</h4>
            <div className="w-32 h-32 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
              <img
                src={data.thumbnail_url}
                alt="Thumbnail preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {data.primary_image_url && validateImageUrl(data.primary_image_url) && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Primary Image Preview
            </h4>
            <div className="w-48 h-32 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
              <img
                src={data.primary_image_url}
                alt="Primary image preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Additional Images */}
      <div>
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
          Additional Images (Optional)
        </h4>

        <div className="flex space-x-2 mb-4">
          <Input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="https://example.com/additional-image.jpg"
            className="flex-1"
          />
          <button
            type="button"
            onClick={addAdditionalImage}
            disabled={
              !newImageUrl.trim() ||
              data.additional_images.length >= 5 ||
              !validateImageUrl(newImageUrl)
            }
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Maximum 5 additional images. Shows different angles or variations.
        </p>

        {/* Additional Images List */}
        {data.additional_images.length > 0 && (
          <div className="space-y-3">
            {data.additional_images.map((imageUrl, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                <div className="w-16 h-16 border border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                  <img
                    src={imageUrl}
                    alt={`Additional image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">{imageUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAdditionalImage(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">📸 Image Guidelines</h4>
        <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
          <li>• Use high-quality images (at least 800x600px)</li>
          <li>• Ensure good lighting and clear product visibility</li>
          <li>• Show the product from multiple angles</li>
          <li>• Use consistent backgrounds when possible</li>
          <li>• Include images showing scale or size reference</li>
          <li>• Supported formats: JPG, PNG, WebP, GIF</li>
        </ul>
      </div>
    </div>
  );
}
