'use client';

interface ReviewStepProps {
  data: {
    name: string;
    category: string;
    sku: string;
    price: string;
    status: string;
    description: string;
    tags: string[];
    thumbnail_url: string;
    primary_image_url: string;
    additional_images: string[];
  };
  onEdit: (stepIndex: number) => void;
}

export function ReviewStep({ data, onEdit }: ReviewStepProps) {
  const categoryLabels: Record<string, string> = {
    apparel: 'Apparel',
    bags: 'Bags',
    drinkware: 'Drinkware',
    electronics: 'Electronics',
    office: 'Office Supplies',
    outdoor: 'Outdoor',
    wellness: 'Health & Wellness',
    other: 'Other',
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          📋 Review Your Product
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Please review all information before creating the product. You can click "Edit" to go back and modify any section.
        </p>
      </div>

      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Basic Information
          </h3>
          <button
            type="button"
            onClick={() => onEdit(0)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
          >
            Edit
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
            <p className="text-gray-900 dark:text-white">{data.name || 'Not specified'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
            <p className="text-gray-900 dark:text-white">
              {categoryLabels[data.category] || 'Not specified'}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">SKU:</span>
            <p className="text-gray-900 dark:text-white">{data.sku || 'Auto-generate'}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Price:</span>
            <p className="text-gray-900 dark:text-white">{formatPrice(data.price)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
              data.status === 'active' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {data.status}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Description
          </h3>
          <button
            type="button"
            onClick={() => onEdit(1)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
          >
            Edit
          </button>
        </div>
        
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {data.description ? (
            <div dangerouslySetInnerHTML={{ __html: data.description }} />
          ) : (
            <p className="text-gray-500 italic">No description provided</p>
          )}
        </div>
        
        {data.description && (
          <p className="text-xs text-gray-500 mt-2">
            {stripHtml(data.description).length} characters
          </p>
        )}
      </div>

      {/* Tags */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tags & Metadata
          </h3>
          <button
            type="button"
            onClick={() => onEdit(2)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
          >
            Edit
          </button>
        </div>
        
        {data.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic text-sm">No tags added</p>
        )}
      </div>

      {/* Images */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Images
          </h3>
          <button
            type="button"
            onClick={() => onEdit(3)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
          >
            Edit
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.thumbnail_url && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thumbnail
                </p>
                <div className="w-24 h-24 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                  <img
                    src={data.thumbnail_url}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
            
            {data.primary_image_url && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Image
                </p>
                <div className="w-32 h-24 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                  <img
                    src={data.primary_image_url}
                    alt="Primary"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {data.additional_images.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Images ({data.additional_images.length})
              </p>
              <div className="flex space-x-2 overflow-x-auto">
                {data.additional_images.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="w-16 h-16 border border-gray-300 dark:border-gray-600 rounded overflow-hidden bg-gray-50 dark:bg-gray-800 flex-shrink-0"
                  >
                    <img
                      src={imageUrl}
                      alt={`Additional ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!data.thumbnail_url && !data.primary_image_url && data.additional_images.length === 0 && (
            <p className="text-gray-500 italic text-sm">No images added</p>
          )}
        </div>
      </div>

      {/* Validation Summary */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          Validation Summary
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${data.name ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>Product name {data.name ? 'provided' : 'required'}</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${data.category ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>Category {data.category ? 'selected' : 'required'}</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${data.description ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>Description {data.description ? 'provided' : 'required'}</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${data.tags.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span>Tags {data.tags.length > 0 ? `(${data.tags.length})` : '(optional but recommended)'}</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${data.thumbnail_url || data.primary_image_url ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span>Images {data.thumbnail_url || data.primary_image_url ? 'provided' : '(optional but recommended)'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}