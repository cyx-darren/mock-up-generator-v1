export interface HSVColor {
  h: number; // Hue: 0-360
  s: number; // Saturation: 0-100
  v: number; // Value: 0-100
}

export interface RGBColor {
  r: number; // Red: 0-255
  g: number; // Green: 0-255
  b: number; // Blue: 0-255
}

export interface ColorRange {
  hMin: number;
  hMax: number;
  sMin: number;
  sMax: number;
  vMin: number;
  vMax: number;
}

export interface DetectionSettings {
  colorRange: ColorRange;
  tolerance: number;
  minArea: number;
  maxArea: number;
  noiseReduction: {
    enabled: boolean;
    kernelSize: number;
    iterations: number;
  };
  edgeSmoothing: {
    enabled: boolean;
    blurRadius: number;
    threshold: number;
  };
}

export interface DetectedRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  confidence: number;
  center: { x: number; y: number };
  boundingBox: { x1: number; y1: number; x2: number; y2: number };
}

export interface ColorDetectionResult {
  regions: DetectedRegion[];
  totalArea: number;
  averageConfidence: number;
  processingTime: number;
  imageAnalysis: {
    dominantColors: HSVColor[];
    colorDistribution: Map<string, number>;
    hasTargetColor: boolean;
  };
}

/**
 * Converts RGB color values to HSV color space
 * @param r Red component (0-255)
 * @param g Green component (0-255)  
 * @param b Blue component (0-255)
 * @returns HSV color object
 */
export function rgbToHsv(r: number, g: number, b: number): HSVColor {
  // Normalize RGB values to 0-1 range
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = 0;
  const v = max;

  // Calculate saturation
  if (max !== 0) {
    s = delta / max;
  }

  // Calculate hue
  if (delta !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / delta) % 6;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    h *= 60;
  }

  // Ensure hue is positive
  if (h < 0) {
    h += 360;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  };
}

/**
 * Converts HSV color values to RGB color space
 * @param h Hue (0-360)
 * @param s Saturation (0-100)
 * @param v Value (0-100)
 * @returns RGB color object
 */
export function hsvToRgb(h: number, s: number, v: number): RGBColor {
  const sNorm = s / 100;
  const vNorm = v / 100;

  const c = vNorm * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vNorm - c;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h >= 0 && h < 60) {
    rPrime = c;
    gPrime = x;
    bPrime = 0;
  } else if (h >= 60 && h < 120) {
    rPrime = x;
    gPrime = c;
    bPrime = 0;
  } else if (h >= 120 && h < 180) {
    rPrime = 0;
    gPrime = c;
    bPrime = x;
  } else if (h >= 180 && h < 240) {
    rPrime = 0;
    gPrime = x;
    bPrime = c;
  } else if (h >= 240 && h < 300) {
    rPrime = x;
    gPrime = 0;
    bPrime = c;
  } else if (h >= 300 && h < 360) {
    rPrime = c;
    gPrime = 0;
    bPrime = x;
  }

  return {
    r: Math.round((rPrime + m) * 255),
    g: Math.round((gPrime + m) * 255),
    b: Math.round((bPrime + m) * 255)
  };
}

/**
 * Predefined green color ranges for constraint detection
 */
export const GREEN_COLOR_RANGES = {
  // Bright/vivid green (typical for design constraints)
  VIVID_GREEN: {
    hMin: 100,
    hMax: 140,
    sMin: 50,
    sMax: 100,
    vMin: 40,
    vMax: 100
  } as ColorRange,
  
  // Darker green (forest/natural green)
  DARK_GREEN: {
    hMin: 80,
    hMax: 120,
    sMin: 30,
    sMax: 100,
    vMin: 20,
    vMax: 60
  } as ColorRange,
  
  // Light green (pastel/mint green)
  LIGHT_GREEN: {
    hMin: 110,
    hMax: 150,
    sMin: 20,
    sMax: 70,
    vMin: 60,
    vMax: 100
  } as ColorRange,
  
  // All green variants (broader range)
  ALL_GREEN: {
    hMin: 80,
    hMax: 160,
    sMin: 15,
    sMax: 100,
    vMin: 15,
    vMax: 100
  } as ColorRange
};

/**
 * Checks if a color (HSV) falls within the specified color range
 * @param color HSV color to check
 * @param range Color range to match against
 * @param tolerance Additional tolerance for matching (0-100)
 * @returns true if color matches range
 */
export function isColorInRange(color: HSVColor, range: ColorRange, tolerance: number = 0): boolean {
  const hTolerance = tolerance * 3.6; // Convert percentage to hue degrees
  const svTolerance = tolerance; // Direct percentage for S/V
  
  // Handle hue wraparound (0-360 degrees)
  const hMin = Math.max(0, range.hMin - hTolerance);
  const hMax = Math.min(360, range.hMax + hTolerance);
  
  let hInRange = false;
  if (hMin <= hMax) {
    // Normal case: no wraparound
    hInRange = color.h >= hMin && color.h <= hMax;
  } else {
    // Wraparound case: range crosses 0 degrees
    hInRange = color.h >= hMin || color.h <= hMax;
  }
  
  const sMin = Math.max(0, range.sMin - svTolerance);
  const sMax = Math.min(100, range.sMax + svTolerance);
  const vMin = Math.max(0, range.vMin - svTolerance);
  const vMax = Math.min(100, range.vMax + svTolerance);
  
  const sInRange = color.s >= sMin && color.s <= sMax;
  const vInRange = color.v >= vMin && color.v <= vMax;
  
  return hInRange && sInRange && vInRange;
}

/**
 * Detects green constraint areas in image data
 * @param imageData ImageData from canvas context
 * @param settings Detection settings including color range and filters
 * @returns Array of detected green regions
 */
export function detectGreenConstraints(
  imageData: ImageData, 
  settings: DetectionSettings
): DetectedRegion[] {
  const { width, height, data } = imageData;
  const pixels = data;
  
  // Create binary mask for green pixels
  const mask = new Uint8Array(width * height);
  
  // First pass: identify green pixels
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    
    // Skip transparent pixels
    if (a < 128) {
      continue;
    }
    
    const hsv = rgbToHsv(r, g, b);
    const pixelIndex = Math.floor(i / 4);
    
    if (isColorInRange(hsv, settings.colorRange, settings.tolerance)) {
      mask[pixelIndex] = 255;
    }
  }
  
  // Apply noise reduction if enabled
  let processedMask: Uint8Array = mask;
  if (settings.noiseReduction.enabled) {
    processedMask = applyNoiseReduction(mask, width, height, settings.noiseReduction);
  }
  
  // Apply edge smoothing if enabled  
  if (settings.edgeSmoothing.enabled) {
    processedMask = applyEdgeSmoothing(processedMask, width, height, settings.edgeSmoothing);
  }
  
  // Find connected components (regions)
  return findConnectedComponents(processedMask, width, height, settings);
}

/**
 * Applies noise reduction using morphological operations
 */
function applyNoiseReduction(
  mask: Uint8Array, 
  width: number, 
  height: number, 
  settings: { kernelSize: number; iterations: number }
): Uint8Array {
  let currentMask = new Uint8Array(mask);
  const kernelRadius = Math.floor(settings.kernelSize / 2);
  
  // Apply erosion followed by dilation (opening operation)
  for (let iteration = 0; iteration < settings.iterations; iteration++) {
    // Erosion pass
    const erodedMask = new Uint8Array(width * height);
    for (let y = kernelRadius; y < height - kernelRadius; y++) {
      for (let x = kernelRadius; x < width - kernelRadius; x++) {
        const index = y * width + x;
        
        let minValue = 255;
        for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
          for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
            const neighborIndex = (y + ky) * width + (x + kx);
            minValue = Math.min(minValue, currentMask[neighborIndex]);
          }
        }
        erodedMask[index] = minValue;
      }
    }
    
    // Dilation pass
    const dilatedMask = new Uint8Array(width * height);
    for (let y = kernelRadius; y < height - kernelRadius; y++) {
      for (let x = kernelRadius; x < width - kernelRadius; x++) {
        const index = y * width + x;
        
        let maxValue = 0;
        for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
          for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
            const neighborIndex = (y + ky) * width + (x + kx);
            maxValue = Math.max(maxValue, erodedMask[neighborIndex]);
          }
        }
        dilatedMask[index] = maxValue;
      }
    }
    
    currentMask = dilatedMask;
  }
  
  return currentMask;
}

/**
 * Applies edge smoothing using Gaussian blur
 */
function applyEdgeSmoothing(
  mask: Uint8Array,
  width: number,
  height: number,
  settings: { blurRadius: number; threshold: number }
): Uint8Array {
  const blurRadius = settings.blurRadius;
  const sigma = blurRadius / 3;
  const kernelSize = Math.ceil(blurRadius * 2) + 1;
  const kernelRadius = Math.floor(kernelSize / 2);
  
  // Generate Gaussian kernel
  const kernel: number[] = [];
  let kernelSum = 0;
  
  for (let i = 0; i < kernelSize; i++) {
    const x = i - kernelRadius;
    const value = Math.exp(-(x * x) / (2 * sigma * sigma));
    kernel[i] = value;
    kernelSum += value;
  }
  
  // Normalize kernel
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= kernelSum;
  }
  
  // Horizontal blur pass
  const tempMask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      
      for (let i = 0; i < kernelSize; i++) {
        const sampleX = Math.max(0, Math.min(width - 1, x + i - kernelRadius));
        const index = y * width + sampleX;
        sum += mask[index] * kernel[i];
      }
      
      tempMask[y * width + x] = Math.round(sum);
    }
  }
  
  // Vertical blur pass
  const blurredMask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      
      for (let i = 0; i < kernelSize; i++) {
        const sampleY = Math.max(0, Math.min(height - 1, y + i - kernelRadius));
        const index = sampleY * width + x;
        sum += tempMask[index] * kernel[i];
      }
      
      // Apply threshold
      const value = Math.round(sum);
      blurredMask[y * width + x] = value >= settings.threshold ? 255 : 0;
    }
  }
  
  return blurredMask;
}

/**
 * Finds connected components in the binary mask
 */
function findConnectedComponents(
  mask: Uint8Array,
  width: number,
  height: number,
  settings: DetectionSettings
): DetectedRegion[] {
  const visited = new Uint8Array(width * height);
  const regions: DetectedRegion[] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      
      if (mask[index] === 255 && !visited[index]) {
        const region = floodFill(mask, visited, x, y, width, height);
        
        if (region.area >= settings.minArea && region.area <= settings.maxArea) {
          regions.push(region);
        }
      }
    }
  }
  
  return regions;
}

/**
 * Flood fill algorithm to find connected region
 */
function floodFill(
  mask: Uint8Array,
  visited: Uint8Array,
  startX: number,
  startY: number,
  width: number,
  height: number
): DetectedRegion {
  const stack: Array<[number, number]> = [[startX, startY]];
  const pixels: Array<[number, number]> = [];
  
  let minX = startX;
  let maxX = startX;
  let minY = startY;
  let maxY = startY;
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const index = y * width + x;
    
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[index] || mask[index] !== 255) continue;
    
    visited[index] = 1;
    pixels.push([x, y]);
    
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    
    // Add 4-connected neighbors
    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }
  
  const area = pixels.length;
  const regionWidth = maxX - minX + 1;
  const regionHeight = maxY - minY + 1;
  const centerX = minX + regionWidth / 2;
  const centerY = minY + regionHeight / 2;
  
  // Calculate confidence based on area density
  const boundingBoxArea = regionWidth * regionHeight;
  const confidence = boundingBoxArea > 0 ? (area / boundingBoxArea) * 100 : 0;
  
  return {
    x: minX,
    y: minY,
    width: regionWidth,
    height: regionHeight,
    area,
    confidence: Math.round(confidence),
    center: { x: Math.round(centerX), y: Math.round(centerY) },
    boundingBox: { x1: minX, y1: minY, x2: maxX, y2: maxY }
  };
}

/**
 * Default detection settings optimized for green constraint detection
 */
export const DEFAULT_DETECTION_SETTINGS: DetectionSettings = {
  colorRange: GREEN_COLOR_RANGES.ALL_GREEN,
  tolerance: 10,
  minArea: 50,
  maxArea: 50000,
  noiseReduction: {
    enabled: true,
    kernelSize: 3,
    iterations: 1
  },
  edgeSmoothing: {
    enabled: true,
    blurRadius: 1,
    threshold: 128
  }
};

/**
 * Main color detection service class
 */
export class ColorDetectionService {
  private settings: DetectionSettings;

  constructor(settings: Partial<DetectionSettings> = {}) {
    this.settings = { ...DEFAULT_DETECTION_SETTINGS, ...settings };
  }

  /**
   * Analyzes an image and detects green constraint regions
   * @param imageFile Image file or blob to analyze
   * @param customSettings Optional settings override
   * @returns Detection results with regions and analysis
   */
  async analyzeImage(
    imageFile: File | Blob,
    customSettings?: Partial<DetectionSettings>
  ): Promise<ColorDetectionResult> {
    const startTime = Date.now();
    const effectiveSettings = { ...this.settings, ...customSettings };

    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      throw new Error('Color detection requires browser environment');
    }

    const url = URL.createObjectURL(imageFile);
    
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Detect green constraint regions
      const regions = detectGreenConstraints(imageData, effectiveSettings);
      
      // Analyze image for additional insights
      const imageAnalysis = this.analyzeImageColors(imageData);
      
      const totalArea = regions.reduce((sum, region) => sum + region.area, 0);
      const averageConfidence = regions.length > 0 
        ? regions.reduce((sum, region) => sum + region.confidence, 0) / regions.length 
        : 0;

      const processingTime = Date.now() - startTime;

      return {
        regions,
        totalArea,
        averageConfidence: Math.round(averageConfidence),
        processingTime,
        imageAnalysis
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Analyzes dominant colors and color distribution in the image
   */
  private analyzeImageColors(imageData: ImageData): ColorDetectionResult['imageAnalysis'] {
    const { data } = imageData;
    const colorMap = new Map<string, number>();
    const hsvColors: HSVColor[] = [];
    
    // Sample every 16th pixel for performance
    for (let i = 0; i < data.length; i += 64) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      if (a < 128) continue; // Skip transparent pixels
      
      const hsv = rgbToHsv(r, g, b);
      hsvColors.push(hsv);
      
      // Group similar colors for distribution analysis
      const colorKey = `${Math.round(hsv.h / 10) * 10}-${Math.round(hsv.s / 20) * 20}-${Math.round(hsv.v / 20) * 20}`;
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }
    
    // Find dominant colors (top 5)
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const dominantColors: HSVColor[] = sortedColors.map(([key]) => {
      const [h, s, v] = key.split('-').map(Number);
      return { h, s, v };
    });
    
    // Check if image contains target green colors
    const hasTargetColor = hsvColors.some(color => 
      isColorInRange(color, this.settings.colorRange, this.settings.tolerance)
    );
    
    return {
      dominantColors,
      colorDistribution: colorMap,
      hasTargetColor
    };
  }

  /**
   * Adjusts detection settings dynamically based on image characteristics
   */
  adaptSettingsForImage(imageAnalysis: ColorDetectionResult['imageAnalysis']): DetectionSettings {
    const adaptedSettings = { ...this.settings };
    
    // If no target color found, increase tolerance
    if (!imageAnalysis.hasTargetColor) {
      adaptedSettings.tolerance = Math.min(25, this.settings.tolerance + 10);
    }
    
    // Adjust noise reduction based on image complexity
    const colorVariety = imageAnalysis.colorDistribution.size;
    if (colorVariety > 50) {
      // Complex image - more aggressive noise reduction
      adaptedSettings.noiseReduction.kernelSize = 5;
      adaptedSettings.noiseReduction.iterations = 2;
    } else if (colorVariety < 20) {
      // Simple image - less noise reduction
      adaptedSettings.noiseReduction.kernelSize = 3;
      adaptedSettings.noiseReduction.iterations = 1;
    }
    
    return adaptedSettings;
  }

  /**
   * Updates detection settings
   */
  updateSettings(newSettings: Partial<DetectionSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Gets current detection settings
   */
  getSettings(): DetectionSettings {
    return { ...this.settings };
  }

  /**
   * Creates a visualization mask showing detected regions
   */
  async createVisualizationMask(
    imageFile: File | Blob,
    regions: DetectedRegion[]
  ): Promise<Blob> {
    if (typeof window === 'undefined') {
      throw new Error('Visualization requires browser environment');
    }

    const url = URL.createObjectURL(imageFile);
    
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image with reduced opacity
      ctx.globalAlpha = 0.5;
      ctx.drawImage(img, 0, 0);
      ctx.globalAlpha = 1.0;

      // Draw detected regions
      regions.forEach((region, index) => {
        // Draw bounding box
        ctx.strokeStyle = `hsl(${(index * 60) % 360}, 70%, 50%)`;
        ctx.lineWidth = 2;
        ctx.strokeRect(region.x, region.y, region.width, region.height);
        
        // Fill region with transparent color
        ctx.fillStyle = `hsla(${(index * 60) % 360}, 70%, 50%, 0.3)`;
        ctx.fillRect(region.x, region.y, region.width, region.height);
        
        // Draw center point
        ctx.fillStyle = `hsl(${(index * 60) % 360}, 70%, 30%)`;
        ctx.beginPath();
        ctx.arc(region.center.x, region.center.y, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw label
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(
          `${index + 1}: ${region.confidence}%`,
          region.x + 5,
          region.y + 15
        );
      });

      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create visualization blob'));
        }, 'image/png');
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

// Export singleton instance
export const colorDetectionService = new ColorDetectionService();

// Convenience functions
export async function detectConstraints(
  imageFile: File | Blob,
  settings?: Partial<DetectionSettings>
): Promise<ColorDetectionResult> {
  return colorDetectionService.analyzeImage(imageFile, settings);
}

export async function createConstraintVisualization(
  imageFile: File | Blob,
  regions: DetectedRegion[]
): Promise<Blob> {
  return colorDetectionService.createVisualizationMask(imageFile, regions);
}