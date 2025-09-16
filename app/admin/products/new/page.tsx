'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Card, CardBody } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { MultiStepWizard, Step } from '@/components/ui/MultiStepWizard';
import { BasicInfoStep } from '@/components/product-form/BasicInfoStep';
import { DescriptionStep } from '@/components/product-form/DescriptionStep';
import { TagsMetadataStep } from '@/components/product-form/TagsMetadataStep';
import { ImagesStep } from '@/components/product-form/ImagesStep';
import { ReviewStep } from '@/components/product-form/ReviewStep';
import { generateSku } from '@/lib/utils/sku-generator';
import {
  validateProductForm,
  getStepValidation,
  type ProductFormData,
} from '@/lib/utils/form-validation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewProductPage() {
  const { user, can } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isGeneratingSku, setIsGeneratingSku] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: '',
    price: '',
    sku: '',
    status: 'active',
    tags: [],
    thumbnail_url: '',
    primary_image_url: '',
    back_image_url: '',
    has_back_printing: false,
    additional_images: [],
    horizontal_enabled: true,
    vertical_enabled: true,
    all_over_enabled: false,
  });

  // Auto-save functionality
  const { hasSavedData, clearSavedData } = useAutoSave({
    key: 'new-product',
    data: formData,
    enabled: true,
    onSave: (data) => {
      console.log('Auto-saved product draft');
    },
    onRestore: (savedData) => {
      if (savedData && Object.keys(savedData).length > 0) {
        setFormData(savedData);
        console.log('Restored product draft from auto-save');
      }
    },
  });

  // Handle field changes
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Generate SKU
  const handleGenerateSku = useCallback(async () => {
    if (!formData.name || !formData.category) return;

    setIsGeneratingSku(true);
    try {
      const sku = generateSku({
        name: formData.name,
        category: formData.category,
      });
      handleFieldChange('sku', sku);
    } catch (error) {
      console.error('SKU generation error:', error);
    } finally {
      setIsGeneratingSku(false);
    }
  }, [formData.name, formData.category, handleFieldChange]);

  // Check if user has permission to create products
  if (!can('canCreateProducts')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardBody>
            <Alert
              type="error"
              message={`You don't have permission to create products. Current role: ${user?.role || 'No role'}`}
            />
            <div className="mt-4">
              <Link href="/admin/dashboard">
                <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                  Back to Dashboard
                </button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Handle form completion
  const handleFormComplete = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate entire form
      const validation = validateProductForm(formData);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0][0];
        setError(firstError);
        return;
      }

      // Prepare submission data
      const submitData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        tags: formData.tags,
        additional_images: formData.additional_images || [],
      };

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      const data = await response.json();
      setSuccess('Product created successfully!');

      // Clear auto-saved data
      clearSavedData();

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Create product error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  // Handle step navigation
  const handleStepEdit = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  // Define steps
  const steps: Step[] = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Product name, category, and pricing',
      component: (
        <BasicInfoStep
          data={{
            name: formData.name,
            category: formData.category,
            sku: formData.sku,
            price: formData.price,
            status: formData.status,
          }}
          onChange={handleFieldChange}
          onGenerateSku={handleGenerateSku}
          isGeneratingSku={isGeneratingSku}
        />
      ),
      isValid: getStepValidation(0, formData),
    },
    {
      id: 'description',
      title: 'Description',
      description: 'Detailed product description',
      component: (
        <DescriptionStep
          data={{ description: formData.description }}
          onChange={handleFieldChange}
        />
      ),
      isValid: getStepValidation(1, formData),
    },
    {
      id: 'tags-metadata',
      title: 'Tags & Metadata',
      description: 'Tags for better searchability',
      component: <TagsMetadataStep data={{ tags: formData.tags }} onChange={handleFieldChange} />,
      isValid: getStepValidation(2, formData),
      canSkip: true,
    },
    {
      id: 'images',
      title: 'Images',
      description: 'Product images and media',
      component: (
        <ImagesStep
          data={{
            thumbnail_url: formData.thumbnail_url,
            primary_image_url: formData.primary_image_url,
            back_image_url: formData.back_image_url,
            has_back_printing: formData.has_back_printing,
            additional_images: formData.additional_images,
            horizontal_enabled: formData.horizontal_enabled,
            vertical_enabled: formData.vertical_enabled,
            all_over_enabled: formData.all_over_enabled,
          }}
          onChange={handleFieldChange}
        />
      ),
      isValid: getStepValidation(3, formData),
      canSkip: true,
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Review and submit',
      component: <ReviewStep data={formData} onEdit={handleStepEdit} />,
      isValid: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create New Product
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Add a new product to your catalog using the step-by-step wizard
              </p>
              {hasSavedData() && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  📝 Draft recovered from previous session
                </p>
              )}
            </div>
            <Link href="/admin/dashboard">
              <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                Back to Dashboard
              </button>
            </Link>
          </div>
        </div>

        <Card>
          <CardBody>
            {error && <Alert type="error" message={error} className="mb-6" />}

            {success && <Alert type="success" message={success} className="mb-6" />}

            {loading && <Alert type="info" message="Creating product..." className="mb-6" />}

            <MultiStepWizard
              steps={steps}
              onComplete={handleFormComplete}
              onCancel={() => router.push('/admin/dashboard')}
              allowSkip={false}
              showStepNumbers={true}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
