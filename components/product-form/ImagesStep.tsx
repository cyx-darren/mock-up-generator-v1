'use client';

import { Input } from '@/components/ui/Input';
import { useState, useCallback } from 'react';

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
  const [uploadProgress, setUploadProgress] = useState({
    thumbnail: 0,
    primary: 0,
    additional: 0,
  });
  const [uploading, setUploading] = useState({
    thumbnail: false,
    primary: false,
    additional: false,
  });

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

  const validateImageFile = (file: File): string | null => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PNG, JPG, JPEG, WebP, or GIF image.';
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 5MB.';
    }

    return null;
  };

  const handleImageUpload = useCallback(
    async (file: File, imageType: 'thumbnail' | 'primary' | 'additional'): Promise<void> => {
      const validationError = validateImageFile(file);
      if (validationError) {
        alert(validationError);
        return;
      }

      setUploading((prev) => ({ ...prev, [imageType]: true }));
      setUploadProgress((prev) => ({ ...prev, [imageType]: 0 }));

      // Declare variables outside try block so they're accessible in catch
      let fileName = '';
      let filePath = '';
      let progressInterval: NodeJS.Timeout;

      try {
        // Generate structured file path for new products (no product ID yet)
        const timestamp = Date.now();
        // Better filename sanitization
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const baseName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        const sanitizedName = baseName
          .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special chars with underscore
          .replace(/_+/g, '_') // Replace multiple underscores with single one
          .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
        fileName = `${timestamp}-${sanitizedName}.${fileExtension.toLowerCase()}`;
        filePath = `products/new/${fileName}`;

        // Simulate upload progress
        progressInterval = setInterval(() => {
          setUploadProgress((prev) => ({
            ...prev,
            [imageType]: Math.min(prev[imageType] + 10, 90),
          }));
        }, 100);

        // Upload file via API endpoint
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload?bucket=gift-items', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        const publicUrl = result.url;

        // Clear progress interval
        clearInterval(progressInterval);
        setUploadProgress((prev) => ({ ...prev, [imageType]: 100 }));

        // Update form data with new URL
        if (imageType === 'thumbnail') {
          onChange('thumbnail_url', publicUrl);
        } else if (imageType === 'primary') {
          onChange('primary_image_url', publicUrl);
        } else if (imageType === 'additional') {
          if (data.additional_images.length < 5) {
            onChange('additional_images', [...data.additional_images, publicUrl]);
          }
        }

        // Reset progress after a delay
        setTimeout(() => {
          setUploadProgress((prev) => ({ ...prev, [imageType]: 0 }));
        }, 1000);
      } catch (error) {
        clearInterval(progressInterval);
        console.error(`Upload ${imageType} error:`, error);
        console.error('File details:', {
          name: file.name,
          size: file.size,
          type: file.type,
          fileName,
          filePath,
        });

        const errorMessage =
          error instanceof Error
            ? `Upload failed: ${error.message}`
            : `Failed to upload ${imageType} image`;

        alert(errorMessage);
        setUploadProgress((prev) => ({ ...prev, [imageType]: 0 }));
      } finally {
        setUploading((prev) => ({ ...prev, [imageType]: false }));
      }
    },
    [data.additional_images, onChange]
  );

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    imageType: 'thumbnail' | 'primary' | 'additional'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, imageType);
    }
    // Reset input value to allow re-uploading the same file
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Primary Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Thumbnail Image
          </label>

          {/* URL Input */}
          <Input
            type="url"
            value={data.thumbnail_url}
            onChange={(e) => onChange('thumbnail_url', e.target.value)}
            placeholder="https://example.com/thumbnail.jpg"
          />

          {/* Upload Section */}
          <div className="flex items-center space-x-4">
            <input
              type="file"
              id="thumbnail-upload"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              onChange={(e) => handleFileSelect(e, 'thumbnail')}
              className="hidden"
            />
            <label
              htmlFor="thumbnail-upload"
              className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ${
                uploading.thumbnail ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading.thumbnail ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload Thumbnail
                </>
              )}
            </label>

            {/* Upload Progress */}
            {uploadProgress.thumbnail > 0 && uploadProgress.thumbnail < 100 && (
              <div className="flex-1 max-w-xs">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.thumbnail}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-1">{uploadProgress.thumbnail}%</span>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Square format recommended (1:1 ratio) • Upload PNG, JPG, WebP, or GIF (max 5MB) or enter
            URL manually
          </p>
          {data.thumbnail_url && !validateImageUrl(data.thumbnail_url) && (
            <p className="text-xs text-red-500">Invalid image URL format</p>
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Primary Image
          </label>

          {/* URL Input */}
          <Input
            type="url"
            value={data.primary_image_url}
            onChange={(e) => onChange('primary_image_url', e.target.value)}
            placeholder="https://example.com/primary.jpg"
          />

          {/* Upload Section */}
          <div className="flex items-center space-x-4">
            <input
              type="file"
              id="primary-upload"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              onChange={(e) => handleFileSelect(e, 'primary')}
              className="hidden"
            />
            <label
              htmlFor="primary-upload"
              className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ${
                uploading.primary ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading.primary ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload Primary Image
                </>
              )}
            </label>

            {/* Upload Progress */}
            {uploadProgress.primary > 0 && uploadProgress.primary < 100 && (
              <div className="flex-1 max-w-xs">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.primary}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-1">{uploadProgress.primary}%</span>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500">
            High resolution product image • Upload PNG, JPG, WebP, or GIF (max 5MB) or enter URL
            manually
          </p>
          {data.primary_image_url && !validateImageUrl(data.primary_image_url) && (
            <p className="text-xs text-red-500">Invalid image URL format</p>
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

        <div className="space-y-3">
          <div className="flex space-x-2">
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
              Add URL
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <input
              type="file"
              id="additional-upload"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              onChange={(e) => handleFileSelect(e, 'additional')}
              className="hidden"
              disabled={data.additional_images.length >= 5}
            />
            <label
              htmlFor="additional-upload"
              className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 ${
                uploading.additional || data.additional_images.length >= 5
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {uploading.additional ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Upload Additional Image
                </>
              )}
            </label>

            {/* Upload Progress */}
            {uploadProgress.additional > 0 && uploadProgress.additional < 100 && (
              <div className="flex-1 max-w-xs">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.additional}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-1">{uploadProgress.additional}%</span>
              </div>
            )}
          </div>
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

      <GuidelinesSection />
    </div>
  );
}

// Collapsible Guidelines Section Component
function GuidelinesSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
      >
        <h4 className="font-medium text-green-900 dark:text-green-100 flex items-center">
          📸 Image Guidelines
        </h4>
        <svg
          className={`h-5 w-5 text-green-700 dark:text-green-300 transition-transform ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
            <li>• Use high-quality images (at least 800x600px)</li>
            <li>• Ensure good lighting and clear product visibility</li>
            <li>• Show the product from multiple angles</li>
            <li>• Use consistent backgrounds when possible</li>
            <li>• Include images showing scale or size reference</li>
            <li>• Supported formats: PNG, JPG, JPEG, WebP, GIF (max 5MB each)</li>
            <li>• Upload directly or enter URLs manually</li>
          </ul>
        </div>
      )}
    </div>
  );
}
