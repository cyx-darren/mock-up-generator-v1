'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getConstraintApplicationService,
  PlacementConstraint,
  LogoPlacement,
  ConstraintApplication,
  ConstraintApplicationOptions,
} from '../../lib/constraint-application';

export default function TestConstraintApplicationPage() {
  const [constraintService] = useState(() => getConstraintApplicationService());
  const [giftItems, setGiftItems] = useState<any[]>([]);
  const [selectedGiftItem, setSelectedGiftItem] = useState<string>('');
  const [constraints, setConstraints] = useState<PlacementConstraint[]>([]);
  const [selectedConstraint, setSelectedConstraint] = useState<PlacementConstraint | null>(null);
  const [logoPlacement, setLogoPlacement] = useState<LogoPlacement>({
    x: 100,
    y: 100,
    width: 150,
    height: 75,
  });
  const [applicationOptions, setApplicationOptions] = useState<ConstraintApplicationOptions>({
    placementType: 'horizontal',
    allowAutoAdjustment: true,
    respectSafetyMargins: true,
    enforceAspectRatio: true,
  });
  const [applicationResult, setApplicationResult] = useState<ConstraintApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load gift items on component mount
  useEffect(() => {
    loadGiftItems();
  }, []);

  // Load constraints when gift item changes
  useEffect(() => {
    if (selectedGiftItem) {
      loadConstraints(selectedGiftItem);
    }
  }, [selectedGiftItem]);

  // Load constraint when placement type changes
  useEffect(() => {
    if (selectedGiftItem && constraints.length > 0) {
      const constraint = constraints.find(
        (c) => c.placement_type === applicationOptions.placementType
      );
      setSelectedConstraint(constraint || null);

      // Set default logo placement if constraint exists
      if (constraint) {
        setLogoPlacement({
          x: constraint.default_x,
          y: constraint.default_y,
          width: constraint.default_width,
          height: constraint.default_height,
        });
      }
    }
  }, [applicationOptions.placementType, constraints, selectedGiftItem]);

  const loadGiftItems = async () => {
    try {
      // Mock data for demonstration - in real app would come from Supabase
      const mockGiftItems = [
        { id: '1', name: 'Coffee Mug', category: 'drinkware' },
        { id: '2', name: 'T-Shirt', category: 'apparel' },
        { id: '3', name: 'Tote Bag', category: 'bags' },
        { id: '4', name: 'Water Bottle', category: 'drinkware' },
        { id: '5', name: 'Notebook', category: 'stationery' },
      ];
      setGiftItems(mockGiftItems);
      if (mockGiftItems.length > 0) {
        setSelectedGiftItem(mockGiftItems[0].id);
      }
    } catch (error) {
      console.error('Error loading gift items:', error);
      setError('Failed to load gift items');
    }
  };

  const loadConstraints = async (giftItemId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Mock constraints data - in real app would come from Supabase
      const mockConstraints: PlacementConstraint[] = [
        {
          id: `constraint-h-${giftItemId}`,
          gift_item_id: giftItemId,
          placement_type: 'horizontal',
          is_enabled: true,
          constraint_x: 50,
          constraint_y: 150,
          constraint_width: 300,
          constraint_height: 100,
          min_logo_width: 80,
          max_logo_width: 250,
          min_logo_height: 40,
          max_logo_height: 80,
          default_x: 100,
          default_y: 175,
          default_width: 150,
          default_height: 75,
          margin_top: 10,
          margin_right: 15,
          margin_bottom: 10,
          margin_left: 15,
          guidelines_text: 'Logo should be centered horizontally on the product',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: `constraint-v-${giftItemId}`,
          gift_item_id: giftItemId,
          placement_type: 'vertical',
          is_enabled: true,
          constraint_x: 150,
          constraint_y: 50,
          constraint_width: 100,
          constraint_height: 300,
          min_logo_width: 40,
          max_logo_width: 80,
          min_logo_height: 80,
          max_logo_height: 250,
          default_x: 175,
          default_y: 100,
          default_width: 50,
          default_height: 100,
          margin_top: 15,
          margin_right: 10,
          margin_bottom: 15,
          margin_left: 10,
          guidelines_text: 'Logo should be centered vertically on the product',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: `constraint-a-${giftItemId}`,
          gift_item_id: giftItemId,
          placement_type: 'all_over',
          is_enabled: true,
          constraint_x: 20,
          constraint_y: 20,
          constraint_width: 360,
          constraint_height: 360,
          min_logo_width: 200,
          max_logo_width: 320,
          min_logo_height: 200,
          max_logo_height: 320,
          default_x: 100,
          default_y: 100,
          default_width: 200,
          default_height: 200,
          margin_top: 20,
          margin_right: 20,
          margin_bottom: 20,
          margin_left: 20,
          guidelines_text: 'Logo pattern will cover the entire product surface',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setConstraints(mockConstraints);
    } catch (error: any) {
      console.error('Error loading constraints:', error);
      setError(`Failed to load constraints: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const applyConstraints = useCallback(() => {
    if (!selectedConstraint) {
      setError('No constraint selected');
      return;
    }

    try {
      const result = constraintService.applyConstraints(
        selectedConstraint,
        logoPlacement,
        applicationOptions
      );
      setApplicationResult(result);
      setError(null);
    } catch (error: any) {
      console.error('Error applying constraints:', error);
      setError(`Failed to apply constraints: ${error.message}`);
    }
  }, [constraintService, selectedConstraint, logoPlacement, applicationOptions]);

  // Auto-apply constraints when inputs change
  useEffect(() => {
    applyConstraints();
  }, [applyConstraints]);

  const getRecommendedPlacement = async () => {
    if (!selectedGiftItem) return;

    try {
      // Mock recommended placement - in real app would use aspect ratio from uploaded logo
      const mockLogoAspectRatio = 2; // 2:1 aspect ratio

      // Use default from constraint as recommendation
      if (selectedConstraint) {
        const recommended: LogoPlacement = {
          x: selectedConstraint.default_x,
          y: selectedConstraint.default_y,
          width: selectedConstraint.default_width,
          height: selectedConstraint.default_height,
        };

        // Adjust for aspect ratio
        if (mockLogoAspectRatio !== recommended.width / recommended.height) {
          if (mockLogoAspectRatio > recommended.width / recommended.height) {
            // Logo is wider
            recommended.width = Math.min(
              recommended.height * mockLogoAspectRatio,
              selectedConstraint.max_logo_width
            );
          } else {
            // Logo is taller
            recommended.height = Math.min(
              recommended.width / mockLogoAspectRatio,
              selectedConstraint.max_logo_height
            );
          }
        }

        setLogoPlacement(recommended);
      }
    } catch (error) {
      console.error('Error getting recommended placement:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Constraint Application Test</h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded mb-8">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Product Selection */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Product Selection</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Gift Item</label>
                <select
                  value={selectedGiftItem}
                  onChange={(e) => setSelectedGiftItem(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  {giftItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Placement Type</label>
                <select
                  value={applicationOptions.placementType}
                  onChange={(e) =>
                    setApplicationOptions((prev) => ({
                      ...prev,
                      placementType: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                  <option value="all_over">All Over</option>
                </select>
              </div>

              <button
                onClick={getRecommendedPlacement}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Get Recommended Placement
              </button>
            </div>

            {/* Logo Placement Controls */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Logo Placement</h2>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">X Position</label>
                  <input
                    type="number"
                    value={logoPlacement.x}
                    onChange={(e) =>
                      setLogoPlacement((prev) => ({ ...prev, x: Number(e.target.value) }))
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Y Position</label>
                  <input
                    type="number"
                    value={logoPlacement.y}
                    onChange={(e) =>
                      setLogoPlacement((prev) => ({ ...prev, y: Number(e.target.value) }))
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Width</label>
                  <input
                    type="number"
                    value={logoPlacement.width}
                    onChange={(e) =>
                      setLogoPlacement((prev) => ({ ...prev, width: Number(e.target.value) }))
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Height</label>
                  <input
                    type="number"
                    value={logoPlacement.height}
                    onChange={(e) =>
                      setLogoPlacement((prev) => ({ ...prev, height: Number(e.target.value) }))
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Application Options */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Application Options</h2>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={applicationOptions.allowAutoAdjustment}
                    onChange={(e) =>
                      setApplicationOptions((prev) => ({
                        ...prev,
                        allowAutoAdjustment: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Allow Auto Adjustment</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={applicationOptions.respectSafetyMargins}
                    onChange={(e) =>
                      setApplicationOptions((prev) => ({
                        ...prev,
                        respectSafetyMargins: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Respect Safety Margins</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={applicationOptions.enforceAspectRatio}
                    onChange={(e) =>
                      setApplicationOptions((prev) => ({
                        ...prev,
                        enforceAspectRatio: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Enforce Aspect Ratio</span>
                </label>
              </div>
            </div>
          </div>

          {/* Visualization and Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visual Preview */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Constraint Visualization</h2>

              {selectedConstraint && (
                <div
                  className="relative border border-gray-300 bg-gray-50"
                  style={{ width: '400px', height: '400px' }}
                >
                  {/* Product background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 opacity-50"></div>

                  {/* Constraint area */}
                  <div
                    className="absolute border-2 border-green-500 bg-green-100 opacity-30"
                    style={{
                      left: `${selectedConstraint.constraint_x}px`,
                      top: `${selectedConstraint.constraint_y}px`,
                      width: `${selectedConstraint.constraint_width}px`,
                      height: `${selectedConstraint.constraint_height}px`,
                    }}
                  ></div>

                  {/* Safety margins (if enabled) */}
                  {applicationOptions.respectSafetyMargins && (
                    <div
                      className="absolute border-2 border-yellow-400 border-dashed bg-yellow-100 opacity-20"
                      style={{
                        left: `${selectedConstraint.constraint_x + selectedConstraint.margin_left}px`,
                        top: `${selectedConstraint.constraint_y + selectedConstraint.margin_top}px`,
                        width: `${selectedConstraint.constraint_width - selectedConstraint.margin_left - selectedConstraint.margin_right}px`,
                        height: `${selectedConstraint.constraint_height - selectedConstraint.margin_top - selectedConstraint.margin_bottom}px`,
                      }}
                    ></div>
                  )}

                  {/* Original logo placement */}
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-200 opacity-50 flex items-center justify-center text-xs font-bold"
                    style={{
                      left: `${logoPlacement.x}px`,
                      top: `${logoPlacement.y}px`,
                      width: `${logoPlacement.width}px`,
                      height: `${logoPlacement.height}px`,
                    }}
                  >
                    Original
                  </div>

                  {/* Applied logo placement */}
                  {applicationResult && (
                    <div
                      className={`absolute border-2 ${applicationResult.isValid ? 'border-green-600 bg-green-200' : 'border-red-600 bg-red-200'} opacity-70 flex items-center justify-center text-xs font-bold`}
                      style={{
                        left: `${applicationResult.appliedPlacement.x}px`,
                        top: `${applicationResult.appliedPlacement.y}px`,
                        width: `${applicationResult.appliedPlacement.width}px`,
                        height: `${applicationResult.appliedPlacement.height}px`,
                      }}
                    >
                      Applied
                    </div>
                  )}

                  {/* Legend */}
                  <div className="absolute bottom-2 right-2 bg-white p-2 rounded shadow text-xs">
                    <div className="flex items-center mb-1">
                      <div className="w-3 h-3 border-2 border-green-500 bg-green-100 opacity-50 mr-2"></div>
                      <span>Constraint Area</span>
                    </div>
                    <div className="flex items-center mb-1">
                      <div className="w-3 h-3 border-2 border-yellow-400 border-dashed bg-yellow-100 opacity-30 mr-2"></div>
                      <span>Safety Margins</span>
                    </div>
                    <div className="flex items-center mb-1">
                      <div className="w-3 h-3 border-2 border-blue-500 bg-blue-200 opacity-50 mr-2"></div>
                      <span>Original</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 border-2 border-green-600 bg-green-200 opacity-70 mr-2"></div>
                      <span>Applied</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Application Results */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Application Results</h2>

              {applicationResult && (
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${applicationResult.isValid ? 'bg-green-500' : 'bg-red-500'}`}
                    >
                      <span className="text-white text-sm">
                        {applicationResult.isValid ? '✓' : '✗'}
                      </span>
                    </div>
                    <span className="font-medium">
                      {applicationResult.isValid
                        ? 'Logo stays within constraints'
                        : 'Constraint violations detected'}
                    </span>
                  </div>

                  {/* Applied Placement */}
                  <div className="border rounded p-3">
                    <h3 className="font-medium mb-2">Applied Placement:</h3>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>X: {applicationResult.appliedPlacement.x}</div>
                      <div>Y: {applicationResult.appliedPlacement.y}</div>
                      <div>W: {applicationResult.appliedPlacement.width}</div>
                      <div>H: {applicationResult.appliedPlacement.height}</div>
                    </div>
                  </div>

                  {/* Violations */}
                  {applicationResult.violations.length > 0 && (
                    <div className="border border-red-200 rounded p-3">
                      <h3 className="font-medium text-red-700 mb-2">Violations:</h3>
                      <ul className="text-sm text-red-600 space-y-1">
                        {applicationResult.violations.map((violation, index) => (
                          <li key={index}>• {violation}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Adjustments */}
                  {applicationResult.adjustments.length > 0 && (
                    <div className="border border-blue-200 rounded p-3">
                      <h3 className="font-medium text-blue-700 mb-2">Adjustments Made:</h3>
                      <ul className="text-sm text-blue-600 space-y-1">
                        {applicationResult.adjustments.map((adjustment, index) => (
                          <li key={index}>• {adjustment}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Safety Margins */}
                  <div className="border rounded p-3">
                    <h3 className="font-medium mb-2">Safety Margins:</h3>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>Top: {applicationResult.safetyMargins.top}</div>
                      <div>Right: {applicationResult.safetyMargins.right}</div>
                      <div>Bottom: {applicationResult.safetyMargins.bottom}</div>
                      <div>Left: {applicationResult.safetyMargins.left}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Task Status */}
        <div className="bg-white p-6 rounded-lg shadow-lg mt-8">
          <h2 className="text-xl font-semibold mb-4">Task 5.2.1 Implementation Status</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Load admin-configured constraints from database</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Apply placement-specific masks for AI generation</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Implement dimension restrictions (min/max width/height)</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Use default positions when constraints cannot be satisfied</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Create boundary enforcement (logo stays within constraint area)</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span>Add safety margins around constraint boundaries</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded">
            <h3 className="font-semibold mb-2">Implementation Features:</h3>
            <ul className="text-sm space-y-1">
              <li>
                • <strong>Database Integration:</strong> Loads constraints from Supabase
              </li>
              <li>
                • <strong>Multi-placement Support:</strong> Horizontal, Vertical, All-over
              </li>
              <li>
                • <strong>Auto-adjustment:</strong> Automatically fixes constraint violations
              </li>
              <li>
                • <strong>Safety Margins:</strong> Configurable margins around constraint areas
              </li>
              <li>
                • <strong>Dimension Validation:</strong> Min/max width and height enforcement
              </li>
              <li>
                • <strong>Aspect Ratio:</strong> Maintains logo proportions during adjustments
              </li>
              <li>
                • <strong>Visual Feedback:</strong> Real-time constraint visualization
              </li>
              <li>
                • <strong>Batch Processing:</strong> Apply constraints to multiple placements
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
