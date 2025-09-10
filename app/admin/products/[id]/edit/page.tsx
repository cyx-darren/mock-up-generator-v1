'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { uploadFile, getPublicUrl } from '@/lib/supabase-client';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  sku: string;
  status: 'active' | 'inactive';
  tags: string[];
  thumbnail_url?: string;
  primary_image_url?: string;
  additional_images?: string[];
}

export default function EditProductPage() {
  const { user, can } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [product, setProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    sku: '',
    status: 'active',
    tags: '',
    thumbnail_url: '',
    primary_image_url: '',
  });

  const [uploadProgress, setUploadProgress] = useState({
    thumbnail: 0,
    primary: 0,
  });

  const [uploading, setUploading] = useState({
    thumbnail: false,
    primary: false,
  });

  const [previews, setPreviews] = useState({
    thumbnail: '',
    primary: '',
  });

  // Check if user has permission to edit products
  if (!can('canEditProducts')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardBody>
            <Alert
              type="error"
              message={`You don't have permission to edit products. Current role: ${user?.role || 'No role'}`}
            />
            <div className="mt-4">
              <Link href="/admin/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Fetch product data
  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  // Update previews when URLs change
  useEffect(() => {
    setPreviews({
      thumbnail: formData.thumbnail_url,
      primary: formData.primary_image_url,
    });
  }, [formData.thumbnail_url, formData.primary_image_url]);

  const fetchProduct = async () => {
    try {
      setFetching(true);
      const response = await fetch(`/api/admin/products/${params.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Product not found');
          return;
        }
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      const productData = data.product;
      setProduct(productData);

      // Populate form with existing data
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        category: productData.category || '',
        price: productData.price?.toString() || '',
        sku: productData.sku || '',
        status: productData.status || 'active',
        tags: Array.isArray(productData.tags) ? productData.tags.join(', ') : '',
        thumbnail_url: productData.thumbnail_url || '',
        primary_image_url: productData.primary_image_url || '',
      });
    } catch (error) {
      console.error('Fetch product error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch product');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateImageFile = (file: File): string | null => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PNG, JPG, JPEG, or WebP image.';
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 5MB.';
    }

    return null;
  };

  const handleImageUpload = async (
    file: File,
    imageType: 'thumbnail' | 'primary'
  ): Promise<void> => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setUploading((prev) => ({ ...prev, [imageType]: true }));
    setUploadProgress((prev) => ({ ...prev, [imageType]: 0 }));

    try {
      // Generate structured file path
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `products/${params.id}/${fileName}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => ({
          ...prev,
          [imageType]: Math.min(prev[imageType] + 10, 90),
        }));
      }, 100);

      // Upload file to Supabase Storage
      await uploadFile('gift-items', filePath, file, {
        contentType: file.type,
        upsert: false,
      });

      // Get public URL
      const publicUrl = await getPublicUrl('gift-items', filePath);

      // Clear progress interval
      clearInterval(progressInterval);
      setUploadProgress((prev) => ({ ...prev, [imageType]: 100 }));

      // Update form data with new URL
      const fieldName = imageType === 'thumbnail' ? 'thumbnail_url' : 'primary_image_url';
      setFormData((prev) => ({
        ...prev,
        [fieldName]: publicUrl,
      }));

      // Set preview
      setPreviews((prev) => ({
        ...prev,
        [imageType]: publicUrl,
      }));

      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress((prev) => ({ ...prev, [imageType]: 0 }));
      }, 1000);
    } catch (error) {
      console.error(`Upload ${imageType} error:`, error);
      setError(
        error instanceof Error
          ? error.message
          : `Failed to upload ${imageType} image`
      );
      setUploadProgress((prev) => ({ ...prev, [imageType]: 0 }));
    } finally {
      setUploading((prev) => ({ ...prev, [imageType]: false }));
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    imageType: 'thumbnail' | 'primary'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, imageType);
    }
    // Reset input value to allow re-uploading the same file
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.category) {
        setError('Name, description, and category are required');
        return;
      }

      // Prepare submission data
      const submitData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      };

      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }

      const data = await response.json();
      setSuccess('Product updated successfully!');

      // Update product state with new data
      setProduct(data.product);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Update product error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardBody>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading product...</span>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardBody>
            <Alert type="error" message={error} />
            <div className="mt-4">
              <Link href="/admin/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Product</h1>
              <p className="text-gray-600 dark:text-gray-400">Update product information</p>
            </div>
            <Link href="/admin/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Product Details</h2>
          </CardHeader>
          <CardBody>
            {error && <Alert type="error" message={error} className="mb-6" />}

            {success && <Alert type="success" message={success} className="mb-6" />}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Name *
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SKU
                  </label>
                  <Input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="Product SKU"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="apparel">Apparel</option>
                    <option value="bags">Bags</option>
                    <option value="drinkware">Drinkware</option>
                    <option value="electronics">Electronics</option>
                    <option value="office">Office Supplies</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="wellness">Health & Wellness</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price
                  </label>
                  <Input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <Input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="tag1, tag2, tag3"
                  />
                  <p className="text-sm text-gray-500 mt-1">Separate tags with commas</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product description"
                  required
                />
              </div>

              {/* Image URLs with Upload */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Images</h3>

                {/* Thumbnail Image */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Thumbnail Image
                  </label>
                  
                  {/* URL Input */}
                  <Input
                    type="url"
                    name="thumbnail_url"
                    value={formData.thumbnail_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                  
                  {/* Upload Section */}
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      id="thumbnail-upload"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
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
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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

                  {/* Preview */}
                  {previews.thumbnail && (
                    <div className="mt-3">
                      <img
                        src={previews.thumbnail}
                        alt="Thumbnail preview"
                        className="w-32 h-32 object-cover border border-gray-300 dark:border-gray-600 rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Upload PNG, JPG, JPEG, or WebP (max 5MB) or enter URL manually
                  </p>
                </div>

                {/* Primary Image */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Primary Image
                  </label>
                  
                  {/* URL Input */}
                  <Input
                    type="url"
                    name="primary_image_url"
                    value={formData.primary_image_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/primary.jpg"
                  />
                  
                  {/* Upload Section */}
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      id="primary-upload"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
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
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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

                  {/* Preview */}
                  {previews.primary && (
                    <div className="mt-3">
                      <img
                        src={previews.primary}
                        alt="Primary image preview"
                        className="w-32 h-32 object-cover border border-gray-300 dark:border-gray-600 rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Upload PNG, JPG, JPEG, or WebP (max 5MB) or enter URL manually
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6">
                <Link href="/admin/dashboard">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Product'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
