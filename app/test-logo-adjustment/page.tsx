'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { LogoAdjustmentService, LogoTransform } from '../../lib/logo-adjustment';

interface ControlPanelProps {
  service: LogoAdjustmentService | null;
  onUpdate: () => void;
}

function ControlPanel({ service, onUpdate }: ControlPanelProps) {
  const [transform, setTransform] = useState<LogoTransform | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showGuides, setShowGuides] = useState(true);

  useEffect(() => {
    if (service) {
      setTransform(service.getCurrentTransform());
      setCanUndo(service.canUndo());
      setCanRedo(service.canRedo());
    }
  }, [service]);

  const handleUpdate = useCallback(() => {
    if (service) {
      setTransform(service.getCurrentTransform());
      setCanUndo(service.canUndo());
      setCanRedo(service.canRedo());
      onUpdate();
    }
  }, [service, onUpdate]);

  if (!service || !transform) {
    return <div>Loading control panel...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Logo Adjustment Controls</h3>
      
      {/* Display current transform values */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h4 className="font-medium mb-2">Current Transform</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Position: ({Math.round(transform.x)}, {Math.round(transform.y)})</div>
          <div>Size: {Math.round(transform.width)} × {Math.round(transform.height)}</div>
          <div>Rotation: {Math.round(transform.rotation)}°</div>
          <div>Scale: {transform.scaleX.toFixed(2)} × {transform.scaleY.toFixed(2)}</div>
        </div>
        <div className="mt-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showGuides}
              onChange={(e) => setShowGuides(e.target.checked)}
              className="mr-2"
            />
            Show Guides
          </label>
        </div>
      </div>

      {/* Undo/Redo */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">History</h4>
        <div className="flex gap-2">
          <button
            onClick={() => { service.undo(); handleUpdate(); }}
            disabled={!canUndo}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Undo
          </button>
          <button
            onClick={() => { service.redo(); handleUpdate(); }}
            disabled={!canRedo}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Redo
          </button>
          <button
            onClick={() => { service.reset(); handleUpdate(); }}
            className="px-3 py-1 bg-red-500 text-white rounded"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Position Controls */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Position</h4>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-sm">X:</label>
            <input
              type="number"
              value={Math.round(transform.x)}
              onChange={(e) => {
                service.setPosition(parseInt(e.target.value), transform.y, { enableConstraints: true });
                handleUpdate();
              }}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm">Y:</label>
            <input
              type="number"
              value={Math.round(transform.y)}
              onChange={(e) => {
                service.setPosition(transform.x, parseInt(e.target.value), { enableConstraints: true });
                handleUpdate();
              }}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button onClick={() => { service.alignLeft(); handleUpdate(); }} className="px-2 py-1 bg-gray-200 rounded">Left</button>
          <button onClick={() => { service.alignCenter(); handleUpdate(); }} className="px-2 py-1 bg-gray-200 rounded">Center</button>
          <button onClick={() => { service.alignRight(); handleUpdate(); }} className="px-2 py-1 bg-gray-200 rounded">Right</button>
          <button onClick={() => { service.alignTop(); handleUpdate(); }} className="px-2 py-1 bg-gray-200 rounded">Top</button>
          <button onClick={() => { service.centerLogo(); handleUpdate(); }} className="px-2 py-1 bg-gray-200 rounded">Middle</button>
          <button onClick={() => { service.alignBottom(); handleUpdate(); }} className="px-2 py-1 bg-gray-200 rounded">Bottom</button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => { service.moveBy(-10, 0); handleUpdate(); }} className="px-2 py-1 bg-blue-100 rounded">← 10px</button>
          <button onClick={() => { service.moveBy(10, 0); handleUpdate(); }} className="px-2 py-1 bg-blue-100 rounded">→ 10px</button>
          <button onClick={() => { service.moveBy(0, -10); handleUpdate(); }} className="px-2 py-1 bg-blue-100 rounded">↑ 10px</button>
          <button onClick={() => { service.moveBy(0, 10); handleUpdate(); }} className="px-2 py-1 bg-blue-100 rounded">↓ 10px</button>
        </div>
      </div>

      {/* Size Controls */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Size</h4>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="block text-sm">Width:</label>
            <input
              type="number"
              value={Math.round(transform.width)}
              onChange={(e) => {
                service.resize(parseInt(e.target.value), transform.height, { enableConstraints: true });
                handleUpdate();
              }}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm">Height:</label>
            <input
              type="number"
              value={Math.round(transform.height)}
              onChange={(e) => {
                service.resize(transform.width, parseInt(e.target.value), { enableConstraints: true });
                handleUpdate();
              }}
              className="w-full px-2 py-1 border rounded"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">Scale (%):</label>
          <input
            type="range"
            min="10"
            max="200"
            value={Math.round(transform.scaleX * 100)}
            onChange={(e) => {
              service.resizeByPercentage(parseInt(e.target.value), { maintainAspectRatio: true, enableConstraints: true });
              handleUpdate();
            }}
            className="w-full"
          />
          <div className="text-sm text-center">{Math.round(transform.scaleX * 100)}%</div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => { service.setSmallSize(); handleUpdate(); }} className="px-2 py-1 bg-green-100 rounded">Small</button>
          <button onClick={() => { service.setMediumSize(); handleUpdate(); }} className="px-2 py-1 bg-green-100 rounded">Medium</button>
          <button onClick={() => { service.setLargeSize(); handleUpdate(); }} className="px-2 py-1 bg-green-100 rounded">Large</button>
          <button onClick={() => { service.fitToArea(); handleUpdate(); }} className="px-2 py-1 bg-green-100 rounded">Fit</button>
        </div>
      </div>

      {/* Rotation Controls */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Rotation</h4>
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max="360"
            value={transform.rotation}
            onChange={(e) => {
              service.setRotation(parseInt(e.target.value));
              handleUpdate();
            }}
            className="w-full"
          />
          <div className="text-sm text-center">{Math.round(transform.rotation)}°</div>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => { service.rotate90CounterClockwise(); handleUpdate(); }} className="px-2 py-1 bg-purple-100 rounded">↺ 90°</button>
          <button onClick={() => { service.rotateBy(-15); handleUpdate(); }} className="px-2 py-1 bg-purple-100 rounded">↺ 15°</button>
          <button onClick={() => { service.rotateBy(15); handleUpdate(); }} className="px-2 py-1 bg-purple-100 rounded">↻ 15°</button>
          <button onClick={() => { service.rotate90Clockwise(); handleUpdate(); }} className="px-2 py-1 bg-purple-100 rounded">↻ 90°</button>
        </div>
      </div>

      {/* Flip Controls */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Flip</h4>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => { service.flipHorizontal(); handleUpdate(); }}
            className={`px-3 py-2 rounded ${transform.flipHorizontal ? 'bg-orange-200' : 'bg-orange-100'}`}
          >
            Flip Horizontal {transform.flipHorizontal ? '✓' : ''}
          </button>
          <button 
            onClick={() => { service.flipVertical(); handleUpdate(); }}
            className={`px-3 py-2 rounded ${transform.flipVertical ? 'bg-orange-200' : 'bg-orange-100'}`}
          >
            Flip Vertical {transform.flipVertical ? '✓' : ''}
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="mt-6 p-3 rounded" style={{ backgroundColor: service.isWithinBounds() ? '#dcfce7' : '#fecaca' }}>
        <div className="text-sm font-medium">
          Status: {service.isWithinBounds() ? '✓ Within bounds' : '⚠ Outside allowed area'}
        </div>
      </div>
    </div>
  );
}

export default function TestLogoAdjustmentPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [service, setService] = useState<LogoAdjustmentService | null>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [showGuides, setShowGuides] = useState(true);

  // Create a sample logo image
  const createSampleLogo = useCallback((): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      
      // Create a sample logo with text and shapes
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(0, 0, 200, 100);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('LOGO', 100, 35);
      
      ctx.font = '14px Arial';
      ctx.fillText('Sample Company', 100, 55);
      
      // Add some decorative elements
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(50, 75, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(150, 75, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = canvas.toDataURL();
    });
  }, []);

  // Initialize the service
  useEffect(() => {
    createSampleLogo().then((img) => {
      setLogoImage(img);
      
      // Create constraint area (leaving margins)
      const constraintArea = {
        x: 50,
        y: 50,
        width: 500,
        height: 300
      };
      
      const adjustmentService = new LogoAdjustmentService(img, 600, 400, constraintArea);
      setService(adjustmentService);
    });
  }, [createSampleLogo]);

  // Render the logo on canvas
  const renderLogo = useCallback(() => {
    if (!service || !canvasRef.current) return;
    
    const canvas = showGuides ? service.renderWithGuides() : service.render();
    if (canvas) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(canvas, 0, 0);
      }
    }
  }, [service, showGuides]);

  useEffect(() => {
    renderLogo();
  }, [renderLogo]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        setLogoImage(img);
        
        const constraintArea = {
          x: 50,
          y: 50,
          width: 500,
          height: 300
        };
        
        const adjustmentService = new LogoAdjustmentService(img, 600, 400, constraintArea);
        setService(adjustmentService);
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const exportResults = () => {
    if (!service) return;
    
    const results = service.export();
    console.log('Export Results:', results);
    
    // Download the result
    if (results.canvas) {
      const link = document.createElement('a');
      link.download = 'logo-adjustment-result.png';
      link.href = results.canvas.toDataURL();
      link.click();
    }
    
    // Display results
    alert(`
Transform: ${JSON.stringify(results.transform, null, 2)}
CSS Transform: ${results.cssTransform}
Valid Position: ${results.isValid}
    `);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Logo Adjustment Tools Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Canvas Area */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Preview Canvas</h2>
              <div className="flex gap-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showGuides}
                    onChange={(e) => setShowGuides(e.target.checked)}
                    className="mr-2"
                  />
                  Show Guides
                </label>
              </div>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 p-4 rounded">
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                className="border border-gray-400 bg-white max-w-full h-auto"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            
            <div className="mt-4 flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="text-sm"
              />
              <button
                onClick={exportResults}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Export Results
              </button>
            </div>
          </div>

          {/* Control Panel */}
          <ControlPanel service={service} onUpdate={renderLogo} />
        </div>

        {/* Feature Documentation */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Feature Documentation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-green-600 mb-2">✓ Resize Functionality</h3>
              <ul className="text-sm space-y-1">
                <li>• Manual width/height input</li>
                <li>• Percentage-based scaling</li>
                <li>• Aspect ratio preservation</li>
                <li>• Preset sizes (Small/Medium/Large)</li>
                <li>• Fit to area function</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">✓ Position Adjustment</h3>
              <ul className="text-sm space-y-1">
                <li>• Manual X/Y coordinate input</li>
                <li>• Arrow key movements (±10px)</li>
                <li>• Alignment helpers (L/C/R/T/M/B)</li>
                <li>• Constraint-aware positioning</li>
                <li>• Snap to grid (optional)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-purple-600 mb-2">✓ Rotation Controls</h3>
              <ul className="text-sm space-y-1">
                <li>• Slider for precise angles</li>
                <li>• 90-degree quick rotations</li>
                <li>• 15-degree incremental rotations</li>
                <li>• Free rotation input</li>
                <li>• Smooth rotation preview</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-orange-600 mb-2">✓ Flip Horizontal/Vertical</h3>
              <ul className="text-sm space-y-1">
                <li>• Independent H/V flipping</li>
                <li>• Visual state indicators</li>
                <li>• Combinable transformations</li>
                <li>• Preserve position on flip</li>
                <li>• Undo/redo support</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-red-600 mb-2">✓ Reset Functions</h3>
              <ul className="text-sm space-y-1">
                <li>• Reset to original state</li>
                <li>• Reset to defaults</li>
                <li>• Maintain constraint compliance</li>
                <li>• Instant reset execution</li>
                <li>• History preservation</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-indigo-600 mb-2">✓ Undo/Redo System</h3>
              <ul className="text-sm space-y-1">
                <li>• 50-state history buffer</li>
                <li>• Visual undo/redo buttons</li>
                <li>• State-aware UI controls</li>
                <li>• Branching history support</li>
                <li>• Memory efficient storage</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 rounded">
            <h3 className="font-semibold text-green-800 mb-2">Advanced Features</h3>
            <ul className="text-sm space-y-1 text-green-700">
              <li>• <strong>Constraint Validation:</strong> Automatic boundary enforcement with visual feedback</li>
              <li>• <strong>Visual Guides:</strong> Constraint area outline, logo bounds, and center point indicators</li>
              <li>• <strong>Export System:</strong> Canvas output, CSS transforms, and validation status</li>
              <li>• <strong>Real-time Preview:</strong> Immediate visual feedback for all transformations</li>
              <li>• <strong>File Upload:</strong> Support for custom logo images (PNG, JPG, SVG)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}