import {
  ColorDetectionResult,
  DetectedRegion,
  DetectionSettings,
  detectGreenConstraints,
  rgbToHsv,
  isColorInRange,
} from './color-detection';

export interface MaskGenerationOptions {
  fillHoles: boolean;
  minHoleSize: number;
  smoothing: {
    enabled: boolean;
    iterations: number;
    kernelSize: number;
  };
  contourSimplification: {
    enabled: boolean;
    epsilon: number; // Contour approximation accuracy
  };
  validation: {
    enabled: boolean;
    minArea: number;
    maxArea: number;
    aspectRatioRange: { min: number; max: number };
  };
}

export interface ContourPoint {
  x: number;
  y: number;
}

export interface Contour {
  points: ContourPoint[];
  area: number;
  perimeter: number;
  boundingRect: { x: number; y: number; width: number; height: number };
  centroid: { x: number; y: number };
  isValid: boolean;
}

export interface MaskValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
  metrics: {
    area: number;
    perimeter: number;
    aspectRatio: number;
    solidity: number; // Area ratio of contour to convex hull
    compactness: number; // Perimeter^2 / (4π * Area)
  };
}

export interface GeneratedMask {
  maskData: Uint8Array;
  width: number;
  height: number;
  contours: Contour[];
  validation: MaskValidationResult;
  processingTime: number;
  options: MaskGenerationOptions;
}

export const DEFAULT_MASK_OPTIONS: MaskGenerationOptions = {
  fillHoles: true,
  minHoleSize: 100,
  smoothing: {
    enabled: true,
    iterations: 2,
    kernelSize: 3,
  },
  contourSimplification: {
    enabled: true,
    epsilon: 2.0,
  },
  validation: {
    enabled: true,
    minArea: 50,
    maxArea: 100000,
    aspectRatioRange: { min: 0.1, max: 10.0 },
  },
};

/**
 * Main mask generation service
 */
export class MaskGenerationService {
  private options: MaskGenerationOptions;

  constructor(options: Partial<MaskGenerationOptions> = {}) {
    this.options = { ...DEFAULT_MASK_OPTIONS, ...options };
  }

  /**
   * Generates a clean binary mask from color detection results
   */
  async generateMask(
    imageData: ImageData,
    detectionSettings: DetectionSettings,
    customOptions?: Partial<MaskGenerationOptions>
  ): Promise<GeneratedMask> {
    const startTime = Date.now();
    const effectiveOptions = { ...this.options, ...customOptions };

    // Step 1: Detect green constraint regions
    const regions = detectGreenConstraints(imageData, detectionSettings);

    // Step 2: Create initial binary mask
    let maskData = this.createBinaryMask(imageData, detectionSettings);

    // Step 3: Apply morphological operations
    if (effectiveOptions.smoothing.enabled) {
      maskData = this.applyMorphologicalOperations(
        maskData,
        imageData.width,
        imageData.height,
        effectiveOptions.smoothing
      );
    }

    // Step 4: Fill holes
    if (effectiveOptions.fillHoles) {
      maskData = this.fillHoles(
        maskData,
        imageData.width,
        imageData.height,
        effectiveOptions.minHoleSize
      );
    }

    // Step 5: Detect contours
    const contours = this.detectContours(maskData, imageData.width, imageData.height);

    // Step 6: Simplify contours if enabled
    const simplifiedContours = effectiveOptions.contourSimplification.enabled
      ? contours.map((contour) =>
          this.simplifyContour(contour, effectiveOptions.contourSimplification.epsilon)
        )
      : contours;

    // Step 7: Validate mask
    const validation = this.validateMask(simplifiedContours, effectiveOptions.validation);

    const processingTime = Date.now() - startTime;

    return {
      maskData,
      width: imageData.width,
      height: imageData.height,
      contours: simplifiedContours,
      validation,
      processingTime,
      options: effectiveOptions,
    };
  }

  /**
   * Creates initial binary mask from color detection
   */
  private createBinaryMask(imageData: ImageData, settings: DetectionSettings): Uint8Array {
    const { width, height, data } = imageData;
    const mask = new Uint8Array(width * height);

    // Process each pixel
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

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

    return mask;
  }

  /**
   * Applies morphological operations (opening and closing)
   */
  private applyMorphologicalOperations(
    mask: Uint8Array,
    width: number,
    height: number,
    options: { iterations: number; kernelSize: number }
  ): Uint8Array {
    let currentMask = new Uint8Array(mask);
    const kernelRadius = Math.floor(options.kernelSize / 2);

    for (let iteration = 0; iteration < options.iterations; iteration++) {
      // Opening operation (erosion followed by dilation)
      currentMask = this.erode(currentMask, width, height, kernelRadius);
      currentMask = this.dilate(currentMask, width, height, kernelRadius);

      // Closing operation (dilation followed by erosion)
      currentMask = this.dilate(currentMask, width, height, kernelRadius);
      currentMask = this.erode(currentMask, width, height, kernelRadius);
    }

    return currentMask;
  }

  /**
   * Erosion operation
   */
  private erode(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
    const result = new Uint8Array(width * height);

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const index = y * width + x;

        let minValue = 255;
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const neighborIndex = (y + ky) * width + (x + kx);
            minValue = Math.min(minValue, mask[neighborIndex]);
          }
        }
        result[index] = minValue;
      }
    }

    return result;
  }

  /**
   * Dilation operation
   */
  private dilate(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
    const result = new Uint8Array(width * height);

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const index = y * width + x;

        let maxValue = 0;
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const neighborIndex = (y + ky) * width + (x + kx);
            maxValue = Math.max(maxValue, mask[neighborIndex]);
          }
        }
        result[index] = maxValue;
      }
    }

    return result;
  }

  /**
   * Fills holes in the binary mask
   */
  private fillHoles(
    mask: Uint8Array,
    width: number,
    height: number,
    minHoleSize: number
  ): Uint8Array {
    const result = new Uint8Array(mask);
    const visited = new Uint8Array(width * height);

    // Find holes (background regions that are surrounded by foreground)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;

        // If this is a background pixel that hasn't been visited
        if (mask[index] === 0 && !visited[index]) {
          const holePixels = this.floodFillBackground(mask, visited, x, y, width, height);

          // If hole is smaller than threshold and not touching edges, fill it
          if (holePixels.length < minHoleSize && !this.touchesEdges(holePixels, width, height)) {
            for (const pixelIndex of holePixels) {
              result[pixelIndex] = 255;
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Flood fill to find connected background region
   */
  private floodFillBackground(
    mask: Uint8Array,
    visited: Uint8Array,
    startX: number,
    startY: number,
    width: number,
    height: number
  ): number[] {
    const stack: Array<[number, number]> = [[startX, startY]];
    const pixels: number[] = [];

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const index = y * width + x;

      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (visited[index] || mask[index] !== 0) continue;

      visited[index] = 1;
      pixels.push(index);

      // Add 4-connected neighbors
      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }

    return pixels;
  }

  /**
   * Checks if pixels touch image edges
   */
  private touchesEdges(pixels: number[], width: number, height: number): boolean {
    for (const pixelIndex of pixels) {
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);

      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Detects contours in the binary mask using Moore neighborhood tracing
   */
  private detectContours(mask: Uint8Array, width: number, height: number): Contour[] {
    const contours: Contour[] = [];
    const processed = new Uint8Array(width * height);

    // Moore neighborhood directions (8-connected)
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
      [1, 0],
      [1, -1],
      [0, -1],
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;

        // Find starting point for contour tracing
        if (mask[index] === 255 && !processed[index]) {
          // Check if this is a boundary pixel
          let isBoundary = false;
          for (const [dx, dy] of directions) {
            const neighborIndex = (y + dy) * width + (x + dx);
            if (mask[neighborIndex] === 0) {
              isBoundary = true;
              break;
            }
          }

          if (isBoundary) {
            const contourPoints = this.traceContour(mask, x, y, width, height, processed);
            if (contourPoints.length > 3) {
              // Minimum viable contour
              const contour = this.createContour(contourPoints);
              contours.push(contour);
            }
          }
        }
      }
    }

    return contours;
  }

  /**
   * Traces contour using Moore neighborhood tracing algorithm
   */
  private traceContour(
    mask: Uint8Array,
    startX: number,
    startY: number,
    width: number,
    height: number,
    processed: Uint8Array
  ): ContourPoint[] {
    const points: ContourPoint[] = [];
    const directions = [
      [0, -1],
      [1, -1],
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
    ];

    let currentX = startX;
    let currentY = startY;
    let direction = 0; // Start looking up

    do {
      points.push({ x: currentX, y: currentY });
      processed[currentY * width + currentX] = 1;

      // Find next contour point
      let found = false;
      for (let i = 0; i < 8; i++) {
        const checkDirection = (direction + i) % 8;
        const [dx, dy] = directions[checkDirection];
        const nextX = currentX + dx;
        const nextY = currentY + dy;

        if (nextX >= 0 && nextX < width && nextY >= 0 && nextY < height) {
          const nextIndex = nextY * width + nextX;
          if (mask[nextIndex] === 255) {
            currentX = nextX;
            currentY = nextY;
            direction = (checkDirection + 6) % 8; // Turn left for next search
            found = true;
            break;
          }
        }
      }

      if (!found) break;

      // Stop if we've returned to start
      if (currentX === startX && currentY === startY && points.length > 3) {
        break;
      }

      // Prevent infinite loops
      if (points.length > width * height) break;
    } while (true);

    return points;
  }

  /**
   * Creates contour object with calculated properties
   */
  private createContour(points: ContourPoint[]): Contour {
    if (points.length === 0) {
      return {
        points: [],
        area: 0,
        perimeter: 0,
        boundingRect: { x: 0, y: 0, width: 0, height: 0 },
        centroid: { x: 0, y: 0 },
        isValid: false,
      };
    }

    // Calculate area using shoelace formula
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    area = Math.abs(area) / 2;

    // Calculate perimeter
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const dx = points[j].x - points[i].x;
      const dy = points[j].y - points[i].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate bounding rectangle
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const boundingRect = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    // Calculate centroid
    let centroidX = 0;
    let centroidY = 0;
    for (const point of points) {
      centroidX += point.x;
      centroidY += point.y;
    }
    centroidX /= points.length;
    centroidY /= points.length;

    return {
      points,
      area,
      perimeter,
      boundingRect,
      centroid: { x: centroidX, y: centroidY },
      isValid: area > 0 && points.length > 3,
    };
  }

  /**
   * Simplifies contour using Douglas-Peucker algorithm
   */
  private simplifyContour(contour: Contour, epsilon: number): Contour {
    if (contour.points.length <= 2) {
      return contour;
    }

    const simplifiedPoints = this.douglasPeucker(contour.points, epsilon);
    return this.createContour(simplifiedPoints);
  }

  /**
   * Douglas-Peucker line simplification algorithm
   */
  private douglasPeucker(points: ContourPoint[], epsilon: number): ContourPoint[] {
    if (points.length <= 2) {
      return points;
    }

    // Find the point with maximum distance from line between start and end
    let maxDistance = 0;
    let maxIndex = 0;
    const start = points[0];
    const end = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.perpendicularDistance(points[i], start, end);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }

    // If max distance is greater than epsilon, recursively simplify
    if (maxDistance > epsilon) {
      const firstHalf = this.douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
      const secondHalf = this.douglasPeucker(points.slice(maxIndex), epsilon);

      // Combine results (remove duplicate point at junction)
      return firstHalf.slice(0, -1).concat(secondHalf);
    } else {
      // If max distance is less than epsilon, return simplified line
      return [start, end];
    }
  }

  /**
   * Calculates perpendicular distance from point to line
   */
  private perpendicularDistance(
    point: ContourPoint,
    lineStart: ContourPoint,
    lineEnd: ContourPoint
  ): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;

    if (dx === 0 && dy === 0) {
      // Line start and end are the same point
      return Math.sqrt((point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2);
    }

    const numerator = Math.abs(
      dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
    );
    const denominator = Math.sqrt(dx * dx + dy * dy);

    return numerator / denominator;
  }

  /**
   * Validates the generated mask
   */
  private validateMask(
    contours: Contour[],
    options: MaskGenerationOptions['validation']
  ): MaskValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const suggestions: string[] = [];
    let isValid = true;

    if (!options.enabled) {
      return {
        isValid: true,
        warnings: [],
        errors: [],
        suggestions: [],
        metrics: { area: 0, perimeter: 0, aspectRatio: 0, solidity: 0, compactness: 0 },
      };
    }

    if (contours.length === 0) {
      errors.push('No valid contours found in the mask');
      isValid = false;
      return {
        isValid,
        warnings,
        errors,
        suggestions: ['Try adjusting color tolerance', 'Check if image contains target colors'],
        metrics: { area: 0, perimeter: 0, aspectRatio: 0, solidity: 0, compactness: 0 },
      };
    }

    // Find the largest contour (main constraint area)
    const mainContour = contours.reduce((largest, current) =>
      current.area > largest.area ? current : largest
    );

    const metrics = this.calculateMaskMetrics(mainContour);

    // Validate area
    if (mainContour.area < options.minArea) {
      errors.push(
        `Constraint area too small: ${Math.round(mainContour.area)} < ${options.minArea} pixels`
      );
      suggestions.push('Increase color tolerance or check image quality');
      isValid = false;
    } else if (mainContour.area > options.maxArea) {
      warnings.push(
        `Constraint area very large: ${Math.round(mainContour.area)} > ${options.maxArea} pixels`
      );
      suggestions.push('Consider reducing color tolerance');
    }

    // Validate aspect ratio
    if (metrics.aspectRatio < options.aspectRatioRange.min) {
      warnings.push(
        `Aspect ratio too narrow: ${metrics.aspectRatio.toFixed(2)} < ${options.aspectRatioRange.min}`
      );
      suggestions.push('Constraint area may be too thin for logo placement');
    } else if (metrics.aspectRatio > options.aspectRatioRange.max) {
      warnings.push(
        `Aspect ratio too wide: ${metrics.aspectRatio.toFixed(2)} > ${options.aspectRatioRange.max}`
      );
      suggestions.push('Constraint area may be too elongated');
    }

    // Quality checks
    if (metrics.solidity < 0.7) {
      warnings.push('Constraint area has irregular shape (low solidity)');
      suggestions.push('Consider enabling hole filling or smoothing');
    }

    if (metrics.compactness > 4.0) {
      warnings.push('Constraint area has complex perimeter (high compactness)');
      suggestions.push('Consider contour simplification');
    }

    // Multiple contours check
    if (contours.length > 1) {
      const totalArea = contours.reduce((sum, c) => sum + c.area, 0);
      const mainAreaRatio = mainContour.area / totalArea;

      if (mainAreaRatio < 0.8) {
        warnings.push(`Multiple constraint areas detected (${contours.length} regions)`);
        suggestions.push('Consider if logo should be placed in largest area only');
      }
    }

    return {
      isValid,
      warnings,
      errors,
      suggestions,
      metrics,
    };
  }

  /**
   * Calculates quality metrics for the mask
   */
  private calculateMaskMetrics(contour: Contour): MaskValidationResult['metrics'] {
    if (!contour.isValid || contour.points.length === 0) {
      return { area: 0, perimeter: 0, aspectRatio: 0, solidity: 0, compactness: 0 };
    }

    const { area, perimeter, boundingRect } = contour;
    const aspectRatio = boundingRect.height > 0 ? boundingRect.width / boundingRect.height : 0;

    // Calculate convex hull area for solidity
    const convexHullArea = this.calculateConvexHullArea(contour.points);
    const solidity = convexHullArea > 0 ? area / convexHullArea : 0;

    // Compactness = perimeter^2 / (4π * area)
    const compactness = area > 0 ? (perimeter * perimeter) / (4 * Math.PI * area) : 0;

    return {
      area,
      perimeter,
      aspectRatio,
      solidity,
      compactness,
    };
  }

  /**
   * Calculates convex hull area using Graham scan algorithm
   */
  private calculateConvexHullArea(points: ContourPoint[]): number {
    if (points.length < 3) return 0;

    // Find convex hull using Graham scan
    const hull = this.grahamScan(points);

    // Calculate area using shoelace formula
    let area = 0;
    for (let i = 0; i < hull.length; i++) {
      const j = (i + 1) % hull.length;
      area += hull[i].x * hull[j].y;
      area -= hull[j].x * hull[i].y;
    }
    return Math.abs(area) / 2;
  }

  /**
   * Graham scan algorithm for convex hull
   */
  private grahamScan(points: ContourPoint[]): ContourPoint[] {
    if (points.length < 3) return points;

    // Find bottom-most point (or leftmost if tied)
    let start = points[0];
    for (const point of points) {
      if (point.y < start.y || (point.y === start.y && point.x < start.x)) {
        start = point;
      }
    }

    // Sort points by polar angle with respect to start point
    const sorted = points
      .filter((p) => p !== start)
      .sort((a, b) => {
        const angleA = Math.atan2(a.y - start.y, a.x - start.x);
        const angleB = Math.atan2(b.y - start.y, b.x - start.x);
        return angleA - angleB;
      });

    const hull = [start];

    for (const point of sorted) {
      // Remove points that make clockwise turn
      while (hull.length > 1) {
        const p1 = hull[hull.length - 2];
        const p2 = hull[hull.length - 1];

        const crossProduct = (p2.x - p1.x) * (point.y - p1.y) - (p2.y - p1.y) * (point.x - p1.x);
        if (crossProduct > 0) break; // Counter-clockwise turn

        hull.pop(); // Remove last point
      }
      hull.push(point);
    }

    return hull;
  }

  /**
   * Exports mask as different formats
   */
  async exportMask(mask: GeneratedMask, format: 'png' | 'svg' | 'json'): Promise<Blob | string> {
    switch (format) {
      case 'png':
        return this.exportAsPNG(mask);
      case 'svg':
        return this.exportAsSVG(mask);
      case 'json':
        return this.exportAsJSON(mask);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Exports mask as PNG image
   */
  private async exportAsPNG(mask: GeneratedMask): Promise<Blob> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('PNG export requires browser environment');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    canvas.width = mask.width;
    canvas.height = mask.height;

    // Create ImageData from mask
    const imageData = ctx.createImageData(mask.width, mask.height);
    const data = imageData.data;

    for (let i = 0; i < mask.maskData.length; i++) {
      const maskValue = mask.maskData[i];
      const pixelIndex = i * 4;

      // White for mask, transparent for background
      data[pixelIndex] = maskValue; // R
      data[pixelIndex + 1] = maskValue; // G
      data[pixelIndex + 2] = maskValue; // B
      data[pixelIndex + 3] = maskValue; // A
    }

    ctx.putImageData(imageData, 0, 0);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create PNG blob'));
      }, 'image/png');
    });
  }

  /**
   * Exports mask as SVG
   */
  private exportAsSVG(mask: GeneratedMask): string {
    const { width, height, contours } = mask;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

    contours.forEach((contour, index) => {
      if (contour.points.length > 2) {
        const pathData =
          contour.points.reduce((path, point, i) => {
            const command = i === 0 ? 'M' : 'L';
            return `${path}${command}${point.x},${point.y}`;
          }, '') + 'Z';

        svg += `<path d="${pathData}" fill="white" stroke="black" stroke-width="1" fill-rule="evenodd"/>`;
      }
    });

    svg += '</svg>';
    return svg;
  }

  /**
   * Exports mask data as JSON
   */
  private exportAsJSON(mask: GeneratedMask): string {
    return JSON.stringify(
      {
        width: mask.width,
        height: mask.height,
        contours: mask.contours,
        validation: mask.validation,
        processingTime: mask.processingTime,
        options: mask.options,
        maskData: Array.from(mask.maskData), // Convert Uint8Array to regular array
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * Updates mask generation options
   */
  updateOptions(newOptions: Partial<MaskGenerationOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Gets current options
   */
  getOptions(): MaskGenerationOptions {
    return { ...this.options };
  }
}

// Export singleton instance
export const maskGenerationService = new MaskGenerationService();

// Convenience functions
export async function generateConstraintMask(
  imageData: ImageData,
  detectionSettings: DetectionSettings,
  options?: Partial<MaskGenerationOptions>
): Promise<GeneratedMask> {
  return maskGenerationService.generateMask(imageData, detectionSettings, options);
}

export async function exportMask(
  mask: GeneratedMask,
  format: 'png' | 'svg' | 'json'
): Promise<Blob | string> {
  return maskGenerationService.exportMask(mask, format);
}
