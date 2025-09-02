/**
 * Advanced Green Color Detection Algorithm for Constraint Areas
 * Supports multiple color spaces and adaptive thresholding
 */

export interface GreenDetectionConfig {
  hueRange: [number, number]; // HSV hue range for green (80-140 degrees)
  saturationThreshold: number; // Minimum saturation (0-100%)
  valueThreshold: number; // Minimum brightness (0-100%)
  rgbThreshold: {
    greenMin: number;
    redMaxRatio: number;
    blueMaxRatio: number;
  };
  tolerance: number; // Detection tolerance (0-1)
  noiseReduction: boolean;
  morphologyOps: boolean;
}

export interface DetectedArea {
  pixels: number;
  percentage: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  contours: Array<
    {
      x: number;
      y: number;
    }[]
  >;
  centroid: {
    x: number;
    y: number;
  };
  aspectRatio: number;
  quality: number; // Detection confidence (0-1)
}

export class GreenColorDetector {
  private config: GreenDetectionConfig;

  constructor(config?: Partial<GreenDetectionConfig>) {
    this.config = {
      hueRange: [80, 140], // Green hue range in HSV
      saturationThreshold: 30,
      valueThreshold: 20,
      rgbThreshold: {
        greenMin: 100,
        redMaxRatio: 1.5,
        blueMaxRatio: 1.5,
      },
      tolerance: 0.1,
      noiseReduction: true,
      morphologyOps: true,
      ...config,
    };
  }

  /**
   * Main detection method - analyzes image data for green areas
   */
  detectGreenAreas(imageData: ImageData, width: number, height: number): DetectedArea {
    const mask = this.createGreenMask(imageData, width, height);

    if (this.config.noiseReduction) {
      this.applyNoiseReduction(mask, width, height);
    }

    if (this.config.morphologyOps) {
      this.applyMorphology(mask, width, height);
    }

    return this.analyzeMask(mask, width, height);
  }

  /**
   * Create binary mask of green pixels using multiple detection methods
   */
  private createGreenMask(imageData: ImageData, width: number, height: number): Uint8Array {
    const data = imageData.data;
    const mask = new Uint8Array(width * height);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Skip transparent pixels
      if (a < 128) {
        continue;
      }

      const pixelIndex = i / 4;

      // Method 1: RGB-based detection
      const isGreenRGB = this.isGreenRGB(r, g, b);

      // Method 2: HSV-based detection
      const isGreenHSV = this.isGreenHSV(r, g, b);

      // Combine methods with tolerance
      if (isGreenRGB || isGreenHSV) {
        mask[pixelIndex] = 255;
      }
    }

    return mask;
  }

  /**
   * RGB-based green detection
   */
  private isGreenRGB(r: number, g: number, b: number): boolean {
    return (
      g >= this.config.rgbThreshold.greenMin &&
      g > r * this.config.rgbThreshold.redMaxRatio &&
      g > b * this.config.rgbThreshold.blueMaxRatio
    );
  }

  /**
   * HSV-based green detection for better color accuracy
   */
  private isGreenHSV(r: number, g: number, b: number): boolean {
    const hsv = this.rgbToHsv(r, g, b);

    return (
      hsv.h >= this.config.hueRange[0] &&
      hsv.h <= this.config.hueRange[1] &&
      hsv.s >= this.config.saturationThreshold &&
      hsv.v >= this.config.valueThreshold
    );
  }

  /**
   * Convert RGB to HSV color space
   */
  private rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    const s = max === 0 ? 0 : diff / max;
    const v = max;

    if (diff !== 0) {
      switch (max) {
        case r:
          h = (g - b) / diff + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / diff + 2;
          break;
        case b:
          h = (r - g) / diff + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: h * 360,
      s: s * 100,
      v: v * 100,
    };
  }

  /**
   * Apply noise reduction using median filter
   */
  private applyNoiseReduction(mask: Uint8Array, width: number, height: number): void {
    const kernel = [-1, -1, -1, 0, 0, 1, 1, 1]; // 3x3 neighborhood
    const temp = new Uint8Array(mask.length);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        const neighbors: number[] = [];

        // Collect 3x3 neighborhood values
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ni = (y + dy) * width + (x + dx);
            neighbors.push(mask[ni]);
          }
        }

        // Apply median filter
        neighbors.sort((a, b) => a - b);
        temp[index] = neighbors[4]; // Median of 9 values
      }
    }

    mask.set(temp);
  }

  /**
   * Apply morphological operations (erosion + dilation)
   */
  private applyMorphology(mask: Uint8Array, width: number, height: number): void {
    // Erosion (remove small noise)
    this.erode(mask, width, height);
    // Dilation (restore main shapes)
    this.dilate(mask, width, height);
  }

  /**
   * Erosion morphological operation
   */
  private erode(mask: Uint8Array, width: number, height: number): void {
    const temp = new Uint8Array(mask.length);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        let minVal = 255;

        // 3x3 structuring element
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ni = (y + dy) * width + (x + dx);
            minVal = Math.min(minVal, mask[ni]);
          }
        }

        temp[index] = minVal;
      }
    }

    mask.set(temp);
  }

  /**
   * Dilation morphological operation
   */
  private dilate(mask: Uint8Array, width: number, height: number): void {
    const temp = new Uint8Array(mask.length);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        let maxVal = 0;

        // 3x3 structuring element
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ni = (y + dy) * width + (x + dx);
            maxVal = Math.max(maxVal, mask[ni]);
          }
        }

        temp[index] = maxVal;
      }
    }

    mask.set(temp);
  }

  /**
   * Analyze the binary mask to extract area information
   */
  private analyzeMask(mask: Uint8Array, width: number, height: number): DetectedArea {
    let greenPixelCount = 0;
    let minX = width,
      minY = height,
      maxX = 0,
      maxY = 0;
    let sumX = 0,
      sumY = 0;

    // Count pixels and find bounds
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        if (mask[index] > 128) {
          greenPixelCount++;
          sumX += x;
          sumY += y;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (greenPixelCount === 0) {
      return {
        pixels: 0,
        percentage: 0,
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        contours: [],
        centroid: { x: 0, y: 0 },
        aspectRatio: 1,
        quality: 0,
      };
    }

    const totalPixels = width * height;
    const percentage = (greenPixelCount / totalPixels) * 100;
    const centroid = {
      x: Math.round(sumX / greenPixelCount),
      y: Math.round(sumY / greenPixelCount),
    };

    const boundsWidth = maxX - minX + 1;
    const boundsHeight = maxY - minY + 1;
    const aspectRatio = boundsWidth / boundsHeight;

    // Calculate detection quality based on area size and compactness
    const areaRatio = greenPixelCount / (boundsWidth * boundsHeight);
    const sizeScore = Math.min(greenPixelCount / (width * height * 0.1), 1); // Prefer 10%+ coverage
    const quality = areaRatio * 0.6 + sizeScore * 0.4;

    // Find contours (simplified edge detection)
    const contours = this.findContours(mask, width, height);

    return {
      pixels: greenPixelCount,
      percentage: parseFloat(percentage.toFixed(2)),
      bounds: {
        x: minX,
        y: minY,
        width: boundsWidth,
        height: boundsHeight,
      },
      contours,
      centroid,
      aspectRatio: parseFloat(aspectRatio.toFixed(2)),
      quality: parseFloat(quality.toFixed(2)),
    };
  }

  /**
   * Simple contour detection using edge following
   */
  private findContours(
    mask: Uint8Array,
    width: number,
    height: number
  ): Array<{ x: number; y: number }[]> {
    const contours: Array<{ x: number; y: number }[]> = [];
    const visited = new Uint8Array(width * height);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;

        if (mask[index] > 128 && !visited[index] && this.isEdgePixel(mask, x, y, width, height)) {
          const contour = this.traceContour(mask, visited, x, y, width, height);
          if (contour.length > 10) {
            // Filter out very small contours
            contours.push(contour);
          }
        }
      }
    }

    return contours;
  }

  /**
   * Check if pixel is on the edge of a green area
   */
  private isEdgePixel(
    mask: Uint8Array,
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    const index = y * width + x;
    if (mask[index] < 128) return false;

    // Check 8-connected neighbors
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const ni = ny * width + nx;
          if (mask[ni] < 128) {
            return true; // Found a non-green neighbor
          }
        }
      }
    }

    return false;
  }

  /**
   * Trace contour starting from edge pixel
   */
  private traceContour(
    mask: Uint8Array,
    visited: Uint8Array,
    startX: number,
    startY: number,
    width: number,
    height: number
  ): { x: number; y: number }[] {
    const contour: { x: number; y: number }[] = [];
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    let x = startX;
    let y = startY;
    let steps = 0;
    const maxSteps = Math.min(1000, (width * height) / 10); // Prevent infinite loops

    while (steps < maxSteps) {
      const index = y * width + x;
      if (visited[index]) break;

      visited[index] = 1;
      contour.push({ x, y });

      // Find next edge pixel
      let found = false;
      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const ni = ny * width + nx;
          if (mask[ni] > 128 && !visited[ni] && this.isEdgePixel(mask, nx, ny, width, height)) {
            x = nx;
            y = ny;
            found = true;
            break;
          }
        }
      }

      if (!found) break;
      steps++;
    }

    return contour;
  }
}
