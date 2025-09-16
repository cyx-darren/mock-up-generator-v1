'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { HorizontalConstraintConfig } from '@/components/constraint-config/HorizontalConstraintConfig';
import { VerticalConstraintConfig } from '@/components/constraint-config/VerticalConstraintConfig';
import { AllOverConstraintConfig } from '@/components/constraint-config/AllOverConstraintConfig';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  horizontalEnabled: boolean;
  verticalEnabled: boolean;
  allOverEnabled: boolean;
  has_back_printing?: boolean;
}

interface PlacementConstraint {
  id: string;
  placementType: 'horizontal' | 'vertical' | 'all_over';
  side?: 'front' | 'back';
  constraintImageUrl: string;
  detectedAreaPixels?: number;
  detectedAreaPercentage?: number;
  minLogoWidth?: number;
  minLogoHeight?: number;
  maxLogoWidth?: number;
  maxLogoHeight?: number;
  defaultXPosition?: number;
  defaultYPosition?: number;
  patternRepeatX?: number;
  patternRepeatY?: number;
  minPatternWidth?: number;
  minPatternHeight?: number;
  maxPatternWidth?: number;
  maxPatternHeight?: number;
  patternSpacing?: number;
  guidelinesText?: string;
}

export default function ProductConstraintsPage() {
  const { user, can } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [constraints, setConstraints] = useState<PlacementConstraint[]>([]);
  const [activeTab, setActiveTab] = useState<'horizontal' | 'vertical' | 'all_over'>('horizontal');
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

  const fetchProductAndConstraints = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch product data
      const productResponse = await fetch(`/api/admin/products/${params.id}`);
      if (!productResponse.ok) {
        if (productResponse.status === 404) {
          setError('Product not found');
          return;
        }
        throw new Error('Failed to fetch product');
      }

      const productData = await productResponse.json();
      setProduct(productData.product);

      // Fetch constraints data
      const constraintsResponse = await fetch(`/api/admin/products/${params.id}/constraints`);
      if (constraintsResponse.ok) {
        const constraintsData = await constraintsResponse.json();
        // Transform snake_case API response to camelCase for component props
        const transformedConstraints = (constraintsData.constraints || []).map(
          (constraint: any) => ({
            id: constraint.id,
            placementType: constraint.placement_type,
            side: constraint.side,
            constraintImageUrl: constraint.constraint_image_url,
            detectedAreaPixels: constraint.detected_area_pixels,
            detectedAreaPercentage: constraint.detected_area_percentage,
            minLogoWidth: constraint.min_logo_width,
            minLogoHeight: constraint.min_logo_height,
            maxLogoWidth: constraint.max_logo_width,
            maxLogoHeight: constraint.max_logo_height,
            defaultXPosition: constraint.default_x_position,
            defaultYPosition: constraint.default_y_position,
            patternRepeatX: constraint.pattern_repeat_x,
            patternRepeatY: constraint.pattern_repeat_y,
            minPatternWidth: constraint.min_pattern_width,
            minPatternHeight: constraint.min_pattern_height,
            maxPatternWidth: constraint.max_pattern_width,
            maxPatternHeight: constraint.max_pattern_height,
            patternSpacing: constraint.pattern_spacing,
            guidelinesText: constraint.guidelines_text,
          })
        );
        setConstraints(transformedConstraints);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch product and constraint data
  useEffect(() => {
    if (params.id) {
      fetchProductAndConstraints();
    }
  }, [params.id]);

  // Check permissions
  if (!can('canEditProducts')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardBody>
            <Alert
              type="error"
              message={`You don't have permission to configure constraints. Current role: ${user?.role || 'No role'}`}
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

  const handleConstraintSave = async (constraintData: any) => {
    try {
      // Add side information for dual-sided products
      const constraintWithSide = {
        ...constraintData,
        side: product?.has_back_printing ? activeSide : 'front',
      };

      const existingConstraint = constraints.find(
        (c) =>
          c.placementType === constraintData.placementType &&
          (product?.has_back_printing ? c.side === activeSide : true)
      );
      const method = existingConstraint ? 'PUT' : 'POST';
      const url = existingConstraint
        ? `/api/admin/constraints/${existingConstraint.id}`
        : '/api/admin/constraints';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(constraintWithSide),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save constraint');
      }

      // Refresh constraints data
      await fetchProductAndConstraints();
    } catch (error) {
      throw error; // Re-throw to be handled by the component
    }
  };

  const getConstraintByType = (type: 'horizontal' | 'vertical' | 'all_over') => {
    if (product?.has_back_printing) {
      return constraints.find((c) => c.placementType === type && c.side === activeSide);
    }
    return constraints.find((c) => c.placementType === type);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardBody>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading product constraints...</span>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardBody>
            <Alert type="error" message={error || 'Product not found'} />
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Placement Constraints
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Configure logo placement constraints for {product.name}
                {product.has_back_printing && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Dual-Sided Product
                  </span>
                )}
              </p>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                SKU: {product.sku} • Category: {product.category}
              </div>
            </div>
            <div className="flex space-x-3">
              <Link href={`/api/admin/products/${product.id}/edit`}>
                <Button variant="outline">Edit Product</Button>
              </Link>
              <Link href="/admin/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Side Navigation (for dual-sided products) */}
        {product.has_back_printing && (
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8" aria-label="Product Sides">
                <button
                  onClick={() => setActiveSide('front')}
                  className={`${
                    activeSide === 'front'
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors flex items-center`}
                >
                  <span className="mr-2">🔍</span>
                  Front Side Constraints
                </button>
                <button
                  onClick={() => setActiveSide('back')}
                  className={`${
                    activeSide === 'back'
                      ? 'border-green-500 text-green-600 dark:text-green-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors flex items-center`}
                >
                  <span className="mr-2">🔄</span>
                  Back Side Constraints
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {product.has_back_printing ? (
                <>Constraints for {activeSide === 'front' ? 'Front' : 'Back'} Side</>
              ) : (
                'Placement Types'
              )}
            </h2>
          </div>
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('horizontal')}
              className={`${
                activeTab === 'horizontal'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Horizontal Placement
              {product.horizontalEnabled && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Enabled
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('vertical')}
              className={`${
                activeTab === 'vertical'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Vertical Placement
              {product.verticalEnabled && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Enabled
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all_over')}
              className={`${
                activeTab === 'all_over'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              All-Over Print
              {product.allOverEnabled && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Enabled
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'horizontal' && (
            <HorizontalConstraintConfig
              productId={product.id}
              existingConstraint={
                getConstraintByType('horizontal')
                  ? {
                      id: getConstraintByType('horizontal')!.id,
                      constraintImageUrl: getConstraintByType('horizontal')!.constraintImageUrl,
                      detectedAreaPixels: getConstraintByType('horizontal')!.detectedAreaPixels,
                      detectedAreaPercentage:
                        getConstraintByType('horizontal')!.detectedAreaPercentage,
                      minLogoWidth: getConstraintByType('horizontal')!.minLogoWidth,
                      minLogoHeight: getConstraintByType('horizontal')!.minLogoHeight,
                      maxLogoWidth: getConstraintByType('horizontal')!.maxLogoWidth,
                      maxLogoHeight: getConstraintByType('horizontal')!.maxLogoHeight,
                      defaultXPosition: getConstraintByType('horizontal')!.defaultXPosition,
                      defaultYPosition: getConstraintByType('horizontal')!.defaultYPosition,
                      guidelinesText: getConstraintByType('horizontal')!.guidelinesText,
                      isEnabled: product.horizontalEnabled,
                    }
                  : undefined
              }
              onSave={handleConstraintSave}
              onCancel={() => router.push('/admin/dashboard')}
            />
          )}

          {activeTab === 'vertical' && (
            <VerticalConstraintConfig
              productId={product.id}
              existingConstraint={
                getConstraintByType('vertical')
                  ? {
                      id: getConstraintByType('vertical')!.id,
                      constraintImageUrl: getConstraintByType('vertical')!.constraintImageUrl,
                      detectedAreaPixels: getConstraintByType('vertical')!.detectedAreaPixels,
                      detectedAreaPercentage:
                        getConstraintByType('vertical')!.detectedAreaPercentage,
                      minLogoWidth: getConstraintByType('vertical')!.minLogoWidth,
                      minLogoHeight: getConstraintByType('vertical')!.minLogoHeight,
                      maxLogoWidth: getConstraintByType('vertical')!.maxLogoWidth,
                      maxLogoHeight: getConstraintByType('vertical')!.maxLogoHeight,
                      defaultXPosition: getConstraintByType('vertical')!.defaultXPosition,
                      defaultYPosition: getConstraintByType('vertical')!.defaultYPosition,
                      guidelinesText: getConstraintByType('vertical')!.guidelinesText,
                      isEnabled: product.verticalEnabled,
                    }
                  : undefined
              }
              onSave={handleConstraintSave}
              onCancel={() => router.push('/admin/dashboard')}
            />
          )}

          {activeTab === 'all_over' && (
            <AllOverConstraintConfig
              productId={product.id}
              existingConstraint={
                getConstraintByType('all_over')
                  ? {
                      id: getConstraintByType('all_over')!.id,
                      constraintImageUrl: getConstraintByType('all_over')!.constraintImageUrl,
                      patternRepeatX: getConstraintByType('all_over')!.patternRepeatX,
                      patternRepeatY: getConstraintByType('all_over')!.patternRepeatY,
                      minPatternWidth: getConstraintByType('all_over')!.minPatternWidth,
                      minPatternHeight: getConstraintByType('all_over')!.minPatternHeight,
                      maxPatternWidth: getConstraintByType('all_over')!.maxPatternWidth,
                      maxPatternHeight: getConstraintByType('all_over')!.maxPatternHeight,
                      patternSpacing: getConstraintByType('all_over')!.patternSpacing,
                      guidelinesText: getConstraintByType('all_over')!.guidelinesText,
                      isEnabled: product.allOverEnabled,
                    }
                  : undefined
              }
              onSave={handleConstraintSave}
              onCancel={() => router.push('/admin/dashboard')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
