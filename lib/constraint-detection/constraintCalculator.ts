/**
 * Constraint Area Calculator and Validation System
 * Calculates usable areas, validates constraints, and provides recommendations
 */

import { DetectedArea } from './greenColorDetector';

export interface ConstraintDimensions {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  defaultX?: number;
  defaultY?: number;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
  score: number; // Overall constraint quality score (0-1)
  usableArea: {
    pixels: number;
    percentage: number;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

export interface ConstraintMetrics {
  totalArea: number;
  usableArea: number;
  aspectRatio: number;
  centerOffset: { x: number; y: number };
  edgeDistances: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fragmentCount: number;
  compactness: number; // How well the area fills its bounding box
}

export class ConstraintCalculator {
  /**
   * Validate constraint area against requirements
   */
  static validateConstraint(
    detectedArea: DetectedArea,
    dimensions: ConstraintDimensions,
    imageWidth: number,
    imageHeight: number,
    placementType: 'horizontal' | 'vertical' | 'all_over' = 'horizontal'
  ): ValidationResult {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let score = 1.0;

    // Basic area validation
    if (detectedArea.pixels === 0) {
      return {
        isValid: false,
        warnings: ['No green areas detected in the image'],
        recommendations: ['Ensure the constraint image has clearly marked green areas'],
        score: 0,
        usableArea: {
          pixels: 0,
          percentage: 0,
          bounds: { x: 0, y: 0, width: 0, height: 0 },
        },
      };
    }

    // Calculate usable area within detected bounds
    const usableArea = this.calculateUsableArea(detectedArea, dimensions);

    // Size validation
    if (detectedArea.bounds.width < dimensions.minWidth) {
      warnings.push(
        `Detected area width (${detectedArea.bounds.width}px) is smaller than minimum required (${dimensions.minWidth}px)`
      );
      score -= 0.2;
    }

    if (detectedArea.bounds.height < dimensions.minHeight) {
      warnings.push(
        `Detected area height (${detectedArea.bounds.height}px) is smaller than minimum required (${dimensions.minHeight}px)`
      );
      score -= 0.2;
    }

    // Area percentage validation
    if (detectedArea.percentage < 5) {
      warnings.push('Detected green area is very small (< 5% of image)');
      recommendations.push('Consider increasing the size of the green marking area');
      score -= 0.15;
    } else if (detectedArea.percentage > 50) {
      warnings.push('Detected green area is very large (> 50% of image)');
      recommendations.push('Consider reducing the green area to be more specific');
      score -= 0.1;
    }

    // Aspect ratio validation based on placement type
    const aspectRatioValidation = this.validateAspectRatio(detectedArea.aspectRatio, placementType);
    if (!aspectRatioValidation.isValid) {
      warnings.push(aspectRatioValidation.warning);
      recommendations.push(aspectRatioValidation.recommendation);
      score -= 0.1;
    }

    // Edge distance validation
    const edgeDistances = this.calculateEdgeDistances(detectedArea.bounds, imageWidth, imageHeight);
    const edgeValidation = this.validateEdgeDistances(edgeDistances, placementType);
    warnings.push(...edgeValidation.warnings);
    recommendations.push(...edgeValidation.recommendations);
    score -= edgeValidation.scorePenalty;

    // Quality validation
    if (detectedArea.quality < 0.3) {
      warnings.push('Low detection quality - the green area may be fragmented or unclear');
      recommendations.push('Use a more solid, well-defined green area');
      score -= 0.15;
    }

    // Fragmentation check
    if (detectedArea.contours.length > 3) {
      warnings.push(
        `Multiple separate green areas detected (${detectedArea.contours.length} areas)`
      );
      recommendations.push('Use a single, continuous green area for better results');
      score -= 0.1;
    }

    // Position validation
    const positionValidation = this.validatePosition(
      detectedArea,
      imageWidth,
      imageHeight,
      placementType
    );
    warnings.push(...positionValidation.warnings);
    recommendations.push(...positionValidation.recommendations);
    score -= positionValidation.scorePenalty;

    const isValid = warnings.length === 0 || !warnings.some((w) => w.includes('required'));

    return {
      isValid,
      warnings,
      recommendations,
      score: Math.max(0, score),
      usableArea,
    };
  }

  /**
   * Calculate metrics for constraint analysis
   */
  static calculateMetrics(
    detectedArea: DetectedArea,
    imageWidth: number,
    imageHeight: number
  ): ConstraintMetrics {
    const { bounds } = detectedArea;
    const centerX = imageWidth / 2;
    const centerY = imageHeight / 2;
    const areaCenterX = bounds.x + bounds.width / 2;
    const areaCenterY = bounds.y + bounds.height / 2;

    const edgeDistances = this.calculateEdgeDistances(bounds, imageWidth, imageHeight);

    // Calculate compactness (how well the area fills its bounding box)
    const boundingBoxArea = bounds.width * bounds.height;
    const compactness = boundingBoxArea > 0 ? detectedArea.pixels / boundingBoxArea : 0;

    return {
      totalArea: detectedArea.pixels,
      usableArea: detectedArea.pixels * 0.8, // Account for padding
      aspectRatio: detectedArea.aspectRatio,
      centerOffset: {
        x: areaCenterX - centerX,
        y: areaCenterY - centerY,
      },
      edgeDistances,
      fragmentCount: detectedArea.contours.length,
      compactness,
    };
  }

  /**
   * Calculate usable area within constraints
   */
  private static calculateUsableArea(detectedArea: DetectedArea, dimensions: ConstraintDimensions) {
    const { bounds } = detectedArea;

    // Apply padding to ensure logos fit comfortably
    const padding = 10;
    const usableWidth = Math.max(0, bounds.width - padding * 2);
    const usableHeight = Math.max(0, bounds.height - padding * 2);

    // Ensure usable area meets minimum requirements
    const finalWidth = Math.max(dimensions.minWidth, Math.min(dimensions.maxWidth, usableWidth));
    const finalHeight = Math.max(
      dimensions.minHeight,
      Math.min(dimensions.maxHeight, usableHeight)
    );

    const usablePixels = finalWidth * finalHeight;
    const totalImagePixels = bounds.width * bounds.height;
    const usablePercentage = totalImagePixels > 0 ? (usablePixels / totalImagePixels) * 100 : 0;

    return {
      pixels: usablePixels,
      percentage: parseFloat(usablePercentage.toFixed(2)),
      bounds: {
        x: bounds.x + padding,
        y: bounds.y + padding,
        width: finalWidth,
        height: finalHeight,
      },
    };
  }

  /**
   * Validate aspect ratio based on placement type
   */
  private static validateAspectRatio(
    aspectRatio: number,
    placementType: 'horizontal' | 'vertical' | 'all_over'
  ) {
    switch (placementType) {
      case 'horizontal':
        if (aspectRatio < 0.5) {
          return {
            isValid: false,
            warning: 'Horizontal placement area is too tall/narrow for typical logos',
            recommendation: 'Consider making the green area wider for horizontal logo placement',
          };
        }
        break;

      case 'vertical':
        if (aspectRatio > 2.0) {
          return {
            isValid: false,
            warning: 'Vertical placement area is too wide for typical logos',
            recommendation:
              'Consider making the green area taller/narrower for vertical logo placement',
          };
        }
        break;

      case 'all_over':
        // All-over patterns are more flexible with aspect ratios
        break;
    }

    return { isValid: true, warning: '', recommendation: '' };
  }

  /**
   * Calculate distances from constraint area to image edges
   */
  private static calculateEdgeDistances(
    bounds: { x: number; y: number; width: number; height: number },
    imageWidth: number,
    imageHeight: number
  ) {
    return {
      top: bounds.y,
      left: bounds.x,
      bottom: imageHeight - (bounds.y + bounds.height),
      right: imageWidth - (bounds.x + bounds.width),
    };
  }

  /**
   * Validate edge distances for safety margins
   */
  private static validateEdgeDistances(
    edgeDistances: { top: number; right: number; bottom: number; left: number },
    placementType: 'horizontal' | 'vertical' | 'all_over'
  ) {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let scorePenalty = 0;

    const minSafeDistance = placementType === 'all_over' ? 5 : 15;

    Object.entries(edgeDistances).forEach(([edge, distance]) => {
      if (distance < minSafeDistance) {
        warnings.push(`Green area is very close to ${edge} edge (${distance}px)`);
        recommendations.push(
          `Move green area at least ${minSafeDistance}px away from ${edge} edge`
        );
        scorePenalty += 0.05;
      }
    });

    return { warnings, recommendations, scorePenalty };
  }

  /**
   * Validate position appropriateness
   */
  private static validatePosition(
    detectedArea: DetectedArea,
    imageWidth: number,
    imageHeight: number,
    placementType: 'horizontal' | 'vertical' | 'all_over'
  ) {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let scorePenalty = 0;

    const centerX = imageWidth / 2;
    const centerY = imageHeight / 2;
    const { centroid } = detectedArea;

    const offsetX = Math.abs(centroid.x - centerX);
    const offsetY = Math.abs(centroid.y - centerY);

    // Check if position is too off-center for the placement type
    switch (placementType) {
      case 'horizontal':
        if (offsetY > imageHeight * 0.3) {
          warnings.push('Horizontal placement area is positioned too far from center vertically');
          recommendations.push('Consider positioning the green area closer to the vertical center');
          scorePenalty += 0.1;
        }
        break;

      case 'vertical':
        if (offsetX > imageWidth * 0.3) {
          warnings.push('Vertical placement area is positioned too far from center horizontally');
          recommendations.push(
            'Consider positioning the green area closer to the horizontal center'
          );
          scorePenalty += 0.1;
        }
        break;
    }

    return { warnings, recommendations, scorePenalty };
  }

  /**
   * Generate recommendations for improving constraint quality
   */
  static generateRecommendations(
    detectedArea: DetectedArea,
    validation: ValidationResult,
    placementType: 'horizontal' | 'vertical' | 'all_over'
  ): string[] {
    const recommendations: string[] = [...validation.recommendations];

    // Add general recommendations based on detection quality
    if (detectedArea.quality < 0.5) {
      recommendations.push('Use a brighter, more saturated green color (#00FF00 recommended)');
      recommendations.push('Ensure the green area has clean, solid edges');
    }

    if (detectedArea.percentage < 10) {
      recommendations.push(
        'Consider increasing the size of the constraint area for better logo visibility'
      );
    }

    if (detectedArea.contours.length > 1) {
      recommendations.push(
        'Use a single, continuous green shape rather than multiple separate areas'
      );
    }

    // Placement-specific recommendations
    switch (placementType) {
      case 'horizontal':
        recommendations.push(
          'For horizontal placement, ensure the green area is wide enough for typical logo proportions'
        );
        break;
      case 'vertical':
        recommendations.push(
          'For vertical placement, ensure the green area is tall enough for stacked logos'
        );
        break;
      case 'all_over':
        recommendations.push('For all-over patterns, mark the entire printable area with green');
        break;
    }

    // Remove duplicates
    return Array.from(new Set(recommendations));
  }
}
