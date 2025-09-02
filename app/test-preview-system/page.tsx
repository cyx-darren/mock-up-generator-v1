'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import PreviewSystem, { PreviewOptions, GradientOptions, PatternOptions, ZoomState } from '../../lib/preview-system';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  const presetColors = [
    '#FFFFFF', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#374151', '#1F2937', '#111827',
    '#FEF2F2', '#FCA5A5', '#EF4444', '#DC2626', '#B91C1C',
    '#FFF7ED', '#FED7AA', '#FB923C', '#EA580C', '#C2410C',
    '#FFFBEB', '#FDE68A', '#F59E0B', '#D97706', '#92400E',
    '#F7FEE7', '#BEF264', '#65A30D', '#4D7C0F', '#365314',
    '#ECFDF5', '#86EFAC', '#10B981', '#059669', '#047857',
    '#F0F9FF', '#7DD3FC', '#0EA5E9', '#0284C7', '#0369A1',
    '#EEF2FF', '#A5B4FC', '#6366F1', '#4F46E5', '#4338CA',
    '#FAF5FF', '#C4B5FD', '#8B5CF6', '#7C3AED', '#6D28D9'
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-2 py-1 border rounded text-sm font-mono"
          placeholder="#000000"
        />
      </div>
      <div className="grid grid-cols-9 gap-1">
        {presetColors.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-6 h-6 rounded border-2 ${value === color ? 'border-blue-500' : 'border-gray-300'}`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}

export default function TestPreviewSystemPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewSystem, setPreviewSystem] = useState<PreviewSystem | null>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [logoCanvas, setLogoCanvas] = useState<HTMLCanvasElement | null>(null);
  
  // Preview options state
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [previewType, setPreviewType] = useState<'solid' | 'gradient' | 'pattern' | 'transparent' | 'environment'>('solid');
  const [environmentType, setEnvironmentType] = useState<'mug' | 'tshirt' | 'business-card' | 'signage' | 'web'>('mug');
  
  // Gradient options
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [gradientColors, setGradientColors] = useState([
    { color: '#3B82F6', stop: 0 },
    { color: '#8B5CF6', stop: 1 }
  ]);
  const [gradientAngle, setGradientAngle] = useState(45);
  
  // Pattern options
  const [patternType, setPatternType] = useState<'dots' | 'stripes' | 'grid' | 'diagonal'>('dots');
  const [patternColor, setPatternColor] = useState('#E5E7EB');
  const [patternSpacing, setPatternSpacing] = useState(30);
  const [patternSize, setPatternSize] = useState(4);
  
  // Zoom state
  const [zoomState, setZoomState] = useState<ZoomState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    minScale: 0.1,
    maxScale: 5
  });
  
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [originalLogoCanvas, setOriginalLogoCanvas] = useState<HTMLCanvasElement | null>(null);

  // Create sample logo
  const createSampleLogo = useCallback((): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 150;
      const ctx = canvas.getContext('2d')!;
      
      // Create a gradient background
      const gradient = ctx.createLinearGradient(0, 0, 300, 0);
      gradient.addColorStop(0, '#6366F1');
      gradient.addColorStop(1, '#8B5CF6');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 300, 150);
      
      // Add company name
      ctx.fillStyle = 'white';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ACME', 150, 60);
      
      // Add tagline
      ctx.font = '18px Arial';
      ctx.fillText('Quality Solutions', 150, 100);
      
      // Add decorative elements
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(50, 40, 12, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(250, 110, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Convert to image
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = canvas.toDataURL();
    });
  }, []);

  // Initialize logo canvas from image
  const createLogoCanvas = useCallback((img: HTMLImageElement): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    return canvas;
  }, []);

  // Initialize
  useEffect(() => {
    const system = new PreviewSystem();
    setPreviewSystem(system);
    
    createSampleLogo().then((img) => {
      setLogoImage(img);
      const logoCanvas = createLogoCanvas(img);
      setLogoCanvas(logoCanvas);
      setOriginalLogoCanvas(createLogoCanvas(img)); // Keep original for comparison
    });
  }, [createSampleLogo, createLogoCanvas]);

  // Generate preview
  const generatePreview = useCallback(async () => {
    if (!previewSystem || !logoCanvas || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    let result;
    
    try {
      switch (previewType) {
        case 'solid':
          result = previewSystem.generateSolidColorPreview(logoCanvas, backgroundColor);
          break;
          
        case 'gradient':
          const gradientOptions: GradientOptions = {
            type: gradientType,
            colors: gradientColors,
            angle: gradientAngle
          };
          result = previewSystem.generateGradientPreview(logoCanvas, gradientOptions);
          break;
          
        case 'pattern':
          const patternOptions: PatternOptions = {
            type: patternType,
            color: patternColor,
            spacing: patternSpacing,
            size: patternSize
          };
          result = previewSystem.generatePatternPreview(logoCanvas, patternOptions);
          break;
          
        case 'transparent':
          result = previewSystem.generateTransparentPreview(logoCanvas, {
            includeTransparencyChecker: true
          });
          break;
          
        case 'environment':
          result = previewSystem.generateEnvironmentPreview(logoCanvas, environmentType);
          break;
      }

      if (result && result.canvas) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(result.canvas, 0, 0);
      }
    } catch (error) {
      console.error('Preview generation error:', error);
    }
  }, [previewSystem, logoCanvas, previewType, backgroundColor, gradientType, gradientColors, gradientAngle, patternType, patternColor, patternSpacing, patternSize, environmentType]);

  // Generate before/after preview
  const generateBeforeAfterPreview = useCallback(async () => {
    if (!previewSystem || !logoCanvas || !originalLogoCanvas || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    try {
      const result = previewSystem.generateBeforeAfterPreview(
        originalLogoCanvas,
        logoCanvas,
        backgroundColor
      );

      if (result && result.canvas) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(result.canvas, 0, 0);
      }
    } catch (error) {
      console.error('Before/after preview error:', error);
    }
  }, [previewSystem, logoCanvas, originalLogoCanvas, backgroundColor]);

  // Update preview when settings change
  useEffect(() => {
    if (showBeforeAfter) {
      generateBeforeAfterPreview();
    } else {
      generatePreview();
    }
  }, [generatePreview, generateBeforeAfterPreview, showBeforeAfter]);

  // Zoom functions
  const handleZoomIn = () => {
    if (previewSystem) {
      previewSystem.zoomIn();
      setZoomState(previewSystem.getZoomState());
      generatePreview();
    }
  };

  const handleZoomOut = () => {
    if (previewSystem) {
      previewSystem.zoomOut();
      setZoomState(previewSystem.getZoomState());
      generatePreview();
    }
  };

  const handleZoomReset = () => {
    if (previewSystem) {
      previewSystem.resetZoom();
      setZoomState(previewSystem.getZoomState());
      generatePreview();
    }
  };

  const handleZoomToFit = () => {
    if (previewSystem && logoCanvas) {
      previewSystem.zoomToFit(logoCanvas.width, logoCanvas.height, 800, 600);
      setZoomState(previewSystem.getZoomState());
      generatePreview();
    }
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const img = new Image();
      img.onload = () => {
        setLogoImage(img);
        const newLogoCanvas = createLogoCanvas(img);
        setLogoCanvas(newLogoCanvas);
        if (!originalLogoCanvas) {
          setOriginalLogoCanvas(createLogoCanvas(img));
        }
      };
      img.src = URL.createObjectURL(file);
    }
  };

  // Export preview
  const exportPreview = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `preview-${previewType}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Preview System Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preview Canvas */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Preview Canvas</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleZoomIn}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Zoom In
                </button>
                <button
                  onClick={handleZoomOut}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Zoom Out
                </button>
                <button
                  onClick={handleZoomToFit}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Fit
                </button>
                <button
                  onClick={handleZoomReset}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                >
                  Reset
                </button>
                <button
                  onClick={exportPreview}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                >
                  Export
                </button>
              </div>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 p-4 rounded">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="border border-gray-400 bg-white max-w-full h-auto"
              />
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <div>Zoom: {Math.round(zoomState.scale * 100)}%</div>
              <div>Offset: ({Math.round(zoomState.offsetX)}, {Math.round(zoomState.offsetY)})</div>
            </div>
            
            <div className="mt-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="text-sm"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Preview Controls</h3>
            
            {/* Preview Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Preview Type</label>
              <select
                value={previewType}
                onChange={(e) => setPreviewType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="solid">Solid Color</option>
                <option value="gradient">Gradient</option>
                <option value="pattern">Pattern</option>
                <option value="transparent">Transparent</option>
                <option value="environment">Environment</option>
              </select>
            </div>

            {/* Before/After Toggle */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showBeforeAfter}
                  onChange={(e) => setShowBeforeAfter(e.target.checked)}
                  className="mr-2"
                />
                Show Before/After Comparison
              </label>
            </div>

            {/* Solid Color Controls */}
            {(previewType === 'solid' || showBeforeAfter) && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Background Color</label>
                <ColorPicker value={backgroundColor} onChange={setBackgroundColor} />
              </div>
            )}

            {/* Gradient Controls */}
            {previewType === 'gradient' && !showBeforeAfter && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Gradient Type</label>
                <select
                  value={gradientType}
                  onChange={(e) => setGradientType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded mb-3"
                >
                  <option value="linear">Linear</option>
                  <option value="radial">Radial</option>
                </select>
                
                {gradientType === 'linear' && (
                  <div className="mb-3">
                    <label className="block text-sm mb-1">Angle: {gradientAngle}°</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={gradientAngle}
                      onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
                
                <div className="space-y-3">
                  {gradientColors.map((colorStop, index) => (
                    <div key={index}>
                      <label className="block text-sm mb-1">Color {index + 1} (Stop: {colorStop.stop})</label>
                      <ColorPicker
                        value={colorStop.color}
                        onChange={(color) => {
                          const newColors = [...gradientColors];
                          newColors[index] = { ...newColors[index], color };
                          setGradientColors(newColors);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pattern Controls */}
            {previewType === 'pattern' && !showBeforeAfter && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Pattern Type</label>
                <select
                  value={patternType}
                  onChange={(e) => setPatternType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded mb-3"
                >
                  <option value="dots">Dots</option>
                  <option value="stripes">Stripes</option>
                  <option value="grid">Grid</option>
                  <option value="diagonal">Diagonal</option>
                </select>
                
                <div className="mb-3">
                  <label className="block text-sm mb-1">Pattern Color</label>
                  <ColorPicker value={patternColor} onChange={setPatternColor} />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm mb-1">Spacing: {patternSpacing}px</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={patternSpacing}
                    onChange={(e) => setPatternSpacing(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm mb-1">Size: {patternSize}px</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={patternSize}
                    onChange={(e) => setPatternSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Environment Controls */}
            {previewType === 'environment' && !showBeforeAfter && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Environment</label>
                <select
                  value={environmentType}
                  onChange={(e) => setEnvironmentType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="mug">Mug</option>
                  <option value="tshirt">T-Shirt</option>
                  <option value="business-card">Business Card</option>
                  <option value="signage">Signage</option>
                  <option value="web">Web Browser</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Feature Documentation */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Feature Documentation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-green-600 mb-2">✓ White Background Preview</h3>
              <ul className="text-sm space-y-1">
                <li>• Clean white background generation</li>
                <li>• High-quality rendering</li>
                <li>• Multiple format support (PNG/JPG/WebP)</li>
                <li>• Configurable dimensions</li>
                <li>• Quality settings</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-blue-600 mb-2">✓ Colored Background Preview</h3>
              <ul className="text-sm space-y-1">
                <li>• Any hex color support</li>
                <li>• Color picker integration</li>
                <li>• Preset color palette</li>
                <li>• Real-time color changes</li>
                <li>• Consistent logo positioning</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-purple-600 mb-2">✓ Custom Color Picker</h3>
              <ul className="text-sm space-y-1">
                <li>• Native HTML5 color input</li>
                <li>• Hex code text input</li>
                <li>• 45 preset colors</li>
                <li>• Visual color selection</li>
                <li>• Active color highlighting</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-orange-600 mb-2">✓ Transparency Checker</h3>
              <ul className="text-sm space-y-1">
                <li>• Checkered transparency pattern</li>
                <li>• Configurable checker size</li>
                <li>• Custom checker colors</li>
                <li>• Transparency detection</li>
                <li>• Visual transparency feedback</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-red-600 mb-2">✓ Before/After View</h3>
              <ul className="text-sm space-y-1">
                <li>• Side-by-side comparison</li>
                <li>• Original vs adjusted logo</li>
                <li>• Clear visual divider</li>
                <li>• Labeled sections</li>
                <li>• Same background for both</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-indigo-600 mb-2">✓ Zoom Functionality</h3>
              <ul className="text-sm space-y-1">
                <li>• Zoom in/out controls</li>
                <li>• Zoom to fit function</li>
                <li>• Zoom reset capability</li>
                <li>• Pan offset support</li>
                <li>• Configurable zoom limits</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold text-blue-800 mb-2">Advanced Features</h3>
            <ul className="text-sm space-y-1 text-blue-700">
              <li>• <strong>Gradient Backgrounds:</strong> Linear and radial gradients with customizable colors and angles</li>
              <li>• <strong>Pattern Backgrounds:</strong> Dots, stripes, grid, and diagonal patterns with size/spacing controls</li>
              <li>• <strong>Environment Mockups:</strong> Realistic contexts (mug, t-shirt, business card, signage, web)</li>
              <li>• <strong>Export System:</strong> Download previews in multiple formats with quality settings</li>
              <li>• <strong>History Management:</strong> Preview history tracking and management</li>
              <li>• <strong>Bulk Generation:</strong> Generate multiple previews with different backgrounds</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}