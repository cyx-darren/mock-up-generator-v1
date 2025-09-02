import { GeneratedMask, Contour, MaskValidationResult } from './mask-generation';
import { DetectedRegion } from './color-detection';

export interface ConstraintRequirements {
  minArea: number;
  maxArea: number;
  aspectRatio: {
    min: number;
    max: number;
  };
  position: {
    allowedRegions: 'center' | 'edges' | 'corners' | 'anywhere';
    marginFromEdges: number; // pixels
    centerBias: number; // 0-1, preference for center positioning
  };
  contiguity: {
    requireSingleRegion: boolean;
    maxDisconnectedRegions: number;
    minMainRegionRatio: number; // ratio of largest region to total area
  };
  geometry: {
    minWidth: number;
    minHeight: number;
    maxEccentricity: number; // 0-1, 0=circle, 1=line
    minConvexity: number; // 0-1, ratio of area to convex hull area
  };
  logoPlacement: {
    minLogoSize: number; // pixels
    maxLogoSize: number; // pixels
    allowedScaling: { min: number; max: number }; // logo scale factors
    paddingFromEdges: number; // minimum pixels from constraint edges
  };
}

export interface ValidationSeverity {
  level: 'error' | 'warning' | 'info';
  blocking: boolean; // prevents constraint from being used
  priority: number; // 1-10, higher = more important
}

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  title: string;
  description: string;
  suggestion: string;
  affectedArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  measuredValue?: number;
  requiredValue?: number;
  category: 'area' | 'aspect' | 'position' | 'contiguity' | 'geometry' | 'placement';
}

export interface ConstraintValidationResult {
  isValid: boolean;
  isUsable: boolean; // can be used despite warnings
  confidence: number; // 0-1, overall confidence in constraint quality
  issues: ValidationIssue[];
  recommendations: string[];
  metrics: {
    area: number;
    aspectRatio: number;
    eccentricity: number;
    convexity: number;
    centerDistance: number;
    edgeDistance: number;
    logoCapacity: { min: number; max: number }; // estimated logo sizes
  };
  placementZones: PlacementZone[];
}

export interface PlacementZone {
  id: string;
  region: { x: number; y: number; width: number; height: number };
  quality: number; // 0-1, suitability for logo placement
  restrictions: string[];
  suggestedLogoSize: { width: number; height: number };
  centerPoint: { x: number; y: number };
}

export const DEFAULT_CONSTRAINT_REQUIREMENTS: ConstraintRequirements = {
  minArea: 500,
  maxArea: 50000,
  aspectRatio: { min: 0.2, max: 5.0 },
  position: {
    allowedRegions: 'anywhere',
    marginFromEdges: 20,
    centerBias: 0.3
  },
  contiguity: {
    requireSingleRegion: false,
    maxDisconnectedRegions: 3,
    minMainRegionRatio: 0.7
  },
  geometry: {
    minWidth: 20,
    minHeight: 20,
    maxEccentricity: 0.95,
    minConvexity: 0.4
  },
  logoPlacement: {
    minLogoSize: 50,
    maxLogoSize: 1000,
    allowedScaling: { min: 0.1, max: 2.0 },
    paddingFromEdges: 10
  }
};

/**
 * Advanced constraint validation service
 */
export class ConstraintValidationService {
  private requirements: ConstraintRequirements;

  constructor(requirements: Partial<ConstraintRequirements> = {}) {
    this.requirements = { ...DEFAULT_CONSTRAINT_REQUIREMENTS, ...requirements };
  }

  /**
   * Performs comprehensive constraint validation
   */
  validateConstraint(
    mask: GeneratedMask,
    imageWidth: number,
    imageHeight: number
  ): ConstraintValidationResult {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];

    if (mask.contours.length === 0) {
      return this.createEmptyResult('No constraint regions detected');
    }

    // Find main contour (largest area)
    const mainContour = mask.contours.reduce((largest, current) => 
      current.area > largest.area ? current : largest
    );

    // Calculate basic metrics
    const metrics = this.calculateMetrics(mask, mainContour, imageWidth, imageHeight);

    // Perform validation checks
    this.checkAreaRequirements(mainContour, issues);
    this.checkAspectRatio(mainContour, issues);
    this.checkContiguity(mask.contours, issues, recommendations);
    this.checkEdgeDistances(mainContour, imageWidth, imageHeight, issues, recommendations);
    this.checkPositionFeasibility(mainContour, imageWidth, imageHeight, issues, recommendations);
    this.checkGeometry(mainContour, issues, recommendations);

    // Generate placement zones
    const placementZones = this.generatePlacementZones(mainContour);

    // Calculate overall confidence
    const confidence = this.calculateConfidence(issues, metrics);
    const isValid = !issues.some(issue => issue.severity.blocking);
    const isUsable = issues.filter(issue => issue.severity.level === 'error').length === 0;

    return {
      isValid,
      isUsable,
      confidence,
      issues,
      recommendations,
      metrics,
      placementZones
    };
  }

  /**
   * Calculates comprehensive metrics for the constraint
   */
  private calculateMetrics(
    mask: GeneratedMask, 
    mainContour: Contour, 
    imageWidth: number, 
    imageHeight: number
  ): ConstraintValidationResult['metrics'] {
    const { boundingRect } = mainContour;
    const aspectRatio = boundingRect.height > 0 ? boundingRect.width / boundingRect.height : 0;

    // Calculate eccentricity (how elongated the shape is)
    const eccentricity = this.calculateEccentricity(mainContour);

    // Calculate convexity (ratio of area to convex hull area)
    const convexHullArea = this.calculateConvexHullArea(mainContour.points);
    const convexity = convexHullArea > 0 ? mainContour.area / convexHullArea : 0;

    // Calculate center distance (how far from image center)
    const imageCenter = { x: imageWidth / 2, y: imageHeight / 2 };
    const centerDistance = Math.sqrt(
      Math.pow(mainContour.centroid.x - imageCenter.x, 2) +
      Math.pow(mainContour.centroid.y - imageCenter.y, 2)
    );

    // Calculate minimum distance to image edges
    const edgeDistance = Math.min(
      boundingRect.x, // left edge
      boundingRect.y, // top edge
      imageWidth - (boundingRect.x + boundingRect.width), // right edge
      imageHeight - (boundingRect.y + boundingRect.height) // bottom edge
    );

    // Estimate logo capacity
    const availableWidth = boundingRect.width - (this.requirements.logoPlacement.paddingFromEdges * 2);
    const availableHeight = boundingRect.height - (this.requirements.logoPlacement.paddingFromEdges * 2);
    const logoCapacity = {
      min: Math.max(this.requirements.logoPlacement.minLogoSize, Math.min(availableWidth, availableHeight) * 0.3),
      max: Math.min(this.requirements.logoPlacement.maxLogoSize, Math.max(availableWidth, availableHeight) * 0.8)
    };

    return {
      area: mainContour.area,
      aspectRatio,
      eccentricity,
      convexity,
      centerDistance,
      edgeDistance,
      logoCapacity
    };
  }

  /**
   * Checks minimum and maximum area requirements
   */
  private checkAreaRequirements(contour: Contour, issues: ValidationIssue[]): void {
    const { minArea, maxArea } = this.requirements;

    if (contour.area < minArea) {
      issues.push({
        id: 'area_too_small',
        severity: { level: 'error', blocking: true, priority: 9 },
        title: 'Constraint area too small',
        description: `Area is ${Math.round(contour.area)} pixels, minimum required is ${minArea} pixels`,
        suggestion: 'Increase color tolerance or use a larger green area in the template',
        measuredValue: contour.area,
        requiredValue: minArea,
        category: 'area',
        affectedArea: contour.boundingRect
      });
    } else if (contour.area > maxArea) {
      issues.push({
        id: 'area_too_large',
        severity: { level: 'warning', blocking: false, priority: 5 },
        title: 'Constraint area very large',
        description: `Area is ${Math.round(contour.area)} pixels, recommended maximum is ${maxArea} pixels`,
        suggestion: 'Consider reducing color tolerance or using a smaller constraint area',
        measuredValue: contour.area,
        requiredValue: maxArea,
        category: 'area',
        affectedArea: contour.boundingRect
      });
    }
  }

  /**
   * Validates aspect ratio requirements
   */
  private checkAspectRatio(contour: Contour, issues: ValidationIssue[]): void {
    const aspectRatio = contour.boundingRect.height > 0 
      ? contour.boundingRect.width / contour.boundingRect.height 
      : 0;

    const { min, max } = this.requirements.aspectRatio;

    if (aspectRatio < min) {
      issues.push({
        id: 'aspect_too_narrow',
        severity: { level: 'warning', blocking: false, priority: 6 },
        title: 'Constraint area too narrow',
        description: `Aspect ratio is ${aspectRatio.toFixed(2)}, minimum recommended is ${min}`,
        suggestion: 'Consider using a wider constraint area for better logo placement',
        measuredValue: aspectRatio,
        requiredValue: min,
        category: 'aspect',
        affectedArea: contour.boundingRect
      });
    } else if (aspectRatio > max) {
      issues.push({
        id: 'aspect_too_wide',
        severity: { level: 'warning', blocking: false, priority: 6 },
        title: 'Constraint area too wide',
        description: `Aspect ratio is ${aspectRatio.toFixed(2)}, maximum recommended is ${max}`,
        suggestion: 'Consider using a more square constraint area for better logo placement',
        measuredValue: aspectRatio,
        requiredValue: max,
        category: 'aspect',
        affectedArea: contour.boundingRect
      });
    }
  }

  /**
   * Validates contiguity requirements (single vs multiple regions)
   */
  private checkContiguity(
    contours: Contour[], 
    issues: ValidationIssue[], 
    recommendations: string[]
  ): void {
    const { requireSingleRegion, maxDisconnectedRegions, minMainRegionRatio } = this.requirements.contiguity;

    if (contours.length === 0) return;

    if (requireSingleRegion && contours.length > 1) {
      issues.push({
        id: 'multiple_regions',
        severity: { level: 'error', blocking: true, priority: 8 },
        title: 'Multiple disconnected regions detected',
        description: `Found ${contours.length} separate regions, but only single region is allowed`,
        suggestion: 'Use hole filling or increase color tolerance to connect regions',
        category: 'contiguity'
      });
    } else if (contours.length > maxDisconnectedRegions) {
      issues.push({
        id: 'too_many_regions',
        severity: { level: 'warning', blocking: false, priority: 7 },
        title: 'Too many disconnected regions',
        description: `Found ${contours.length} regions, maximum recommended is ${maxDisconnectedRegions}`,
        suggestion: 'Consider region merging or use the largest region only',
        category: 'contiguity'
      });
    }

    if (contours.length > 1) {
      const totalArea = contours.reduce((sum, c) => sum + c.area, 0);
      const mainArea = contours[0].area;
      const mainRatio = mainArea / totalArea;

      if (mainRatio < minMainRegionRatio) {
        issues.push({
          id: 'fragmented_regions',
          severity: { level: 'warning', blocking: false, priority: 6 },
          title: 'Constraint area is fragmented',
          description: `Main region contains only ${(mainRatio * 100).toFixed(1)}% of total area`,
          suggestion: 'Consider using only the largest region or improve region connectivity',
          measuredValue: mainRatio,
          requiredValue: minMainRegionRatio,
          category: 'contiguity'
        });

        recommendations.push('Consider enabling hole filling to connect nearby regions');
        recommendations.push('Use higher morphological smoothing iterations');
      }
    }
  }

  /**
   * Checks distance from image edges
   */
  private checkEdgeDistances(
    contour: Contour, 
    imageWidth: number, 
    imageHeight: number,
    issues: ValidationIssue[],
    recommendations: string[]
  ): void {
    const { marginFromEdges } = this.requirements.position;
    const { boundingRect } = contour;

    const distances = {
      left: boundingRect.x,
      top: boundingRect.y,
      right: imageWidth - (boundingRect.x + boundingRect.width),
      bottom: imageHeight - (boundingRect.y + boundingRect.height)
    };

    const minDistance = Math.min(...Object.values(distances));

    if (minDistance < marginFromEdges) {
      const closestEdge = Object.keys(distances).find(
        edge => distances[edge as keyof typeof distances] === minDistance
      );

      issues.push({
        id: 'too_close_to_edge',
        severity: { level: 'warning', blocking: false, priority: 5 },
        title: 'Constraint too close to image edge',
        description: `Distance to ${closestEdge} edge is ${minDistance}px, recommended minimum is ${marginFromEdges}px`,
        suggestion: 'Ensure adequate margin for logo placement and visual balance',
        measuredValue: minDistance,
        requiredValue: marginFromEdges,
        category: 'position',
        affectedArea: boundingRect
      });

      recommendations.push(`Add more padding around the constraint area (especially on ${closestEdge} side)`);
    }

    // Check for edge-hugging (constraint extends to very edge)
    const edgeHuggingThreshold = 5;
    Object.entries(distances).forEach(([edge, distance]) => {
      if (distance < edgeHuggingThreshold) {
        issues.push({
          id: `hugging_${edge}_edge`,
          severity: { level: 'info', blocking: false, priority: 3 },
          title: `Constraint extends to ${edge} edge`,
          description: `Very close to ${edge} edge (${distance}px), may limit logo placement options`,
          suggestion: 'Consider leaving more space for visual breathing room',
          category: 'position'
        });
      }
    });
  }

  /**
   * Validates position feasibility for logo placement
   */
  private checkPositionFeasibility(
    contour: Contour,
    imageWidth: number,
    imageHeight: number,
    issues: ValidationIssue[],
    recommendations: string[]
  ): void {
    const { allowedRegions, centerBias } = this.requirements.position;
    const { boundingRect, centroid } = contour;

    const imageCenter = { x: imageWidth / 2, y: imageHeight / 2 };
    const centerDistance = Math.sqrt(
      Math.pow(centroid.x - imageCenter.x, 2) +
      Math.pow(centroid.y - imageCenter.y, 2)
    );
    const maxCenterDistance = Math.sqrt(
      Math.pow(imageWidth / 2, 2) + Math.pow(imageHeight / 2, 2)
    );
    const centerDistanceRatio = centerDistance / maxCenterDistance;

    // Check position preferences
    if (allowedRegions === 'center' && centerDistanceRatio > 0.3) {
      issues.push({
        id: 'not_centered',
        severity: { level: 'warning', blocking: false, priority: 4 },
        title: 'Constraint not well-centered',
        description: `Constraint center is ${Math.round(centerDistance)}px from image center`,
        suggestion: 'Move constraint closer to image center for better visual balance',
        category: 'position',
        affectedArea: boundingRect
      });
    }

    // Check if constraint allows reasonable logo sizes
    const availableWidth = boundingRect.width - (this.requirements.logoPlacement.paddingFromEdges * 2);
    const availableHeight = boundingRect.height - (this.requirements.logoPlacement.paddingFromEdges * 2);

    if (availableWidth < this.requirements.logoPlacement.minLogoSize || 
        availableHeight < this.requirements.logoPlacement.minLogoSize) {
      issues.push({
        id: 'insufficient_logo_space',
        severity: { level: 'error', blocking: true, priority: 9 },
        title: 'Insufficient space for logo placement',
        description: `Available space is ${availableWidth}×${availableHeight}px, minimum logo needs ${this.requirements.logoPlacement.minLogoSize}×${this.requirements.logoPlacement.minLogoSize}px`,
        suggestion: 'Increase constraint area or reduce padding requirements',
        category: 'placement',
        affectedArea: boundingRect
      });
    }

    // Provide positioning recommendations based on center bias
    if (centerBias > 0.5 && centerDistanceRatio > 0.4) {
      recommendations.push('Consider repositioning constraint closer to center for better visual impact');
    } else if (centerBias < 0.3 && centerDistanceRatio < 0.2) {
      recommendations.push('Constraint is very centered - consider off-center placement for dynamic composition');
    }
  }

  /**
   * Checks geometric properties of the constraint
   */
  private checkGeometry(
    contour: Contour,
    issues: ValidationIssue[],
    recommendations: string[]
  ): void {
    const { minWidth, minHeight, maxEccentricity, minConvexity } = this.requirements.geometry;
    const { boundingRect } = contour;

    // Check minimum dimensions
    if (boundingRect.width < minWidth) {
      issues.push({
        id: 'width_too_small',
        severity: { level: 'warning', blocking: false, priority: 6 },
        title: 'Constraint width too small',
        description: `Width is ${boundingRect.width}px, recommended minimum is ${minWidth}px`,
        suggestion: 'Increase constraint width for better logo placement',
        measuredValue: boundingRect.width,
        requiredValue: minWidth,
        category: 'geometry'
      });
    }

    if (boundingRect.height < minHeight) {
      issues.push({
        id: 'height_too_small',
        severity: { level: 'warning', blocking: false, priority: 6 },
        title: 'Constraint height too small',
        description: `Height is ${boundingRect.height}px, recommended minimum is ${minHeight}px`,
        suggestion: 'Increase constraint height for better logo placement',
        measuredValue: boundingRect.height,
        requiredValue: minHeight,
        category: 'geometry'
      });
    }

    // Check shape properties
    const eccentricity = this.calculateEccentricity(contour);
    if (eccentricity > maxEccentricity) {
      issues.push({
        id: 'too_elongated',
        severity: { level: 'info', blocking: false, priority: 4 },
        title: 'Constraint shape very elongated',
        description: `Shape eccentricity is ${eccentricity.toFixed(2)}, may limit logo aspect ratios`,
        suggestion: 'Consider using a more balanced shape for versatile logo placement',
        measuredValue: eccentricity,
        requiredValue: maxEccentricity,
        category: 'geometry'
      });
    }

    const convexHullArea = this.calculateConvexHullArea(contour.points);
    const convexity = convexHullArea > 0 ? contour.area / convexHullArea : 0;
    
    if (convexity < minConvexity) {
      issues.push({
        id: 'irregular_shape',
        severity: { level: 'warning', blocking: false, priority: 5 },
        title: 'Constraint has irregular shape',
        description: `Shape convexity is ${convexity.toFixed(2)}, indicating concave or irregular boundaries`,
        suggestion: 'Consider shape smoothing or using a more regular constraint area',
        measuredValue: convexity,
        requiredValue: minConvexity,
        category: 'geometry'
      });

      recommendations.push('Enable morphological smoothing to regularize shape');
      recommendations.push('Consider manual adjustment of constraint boundaries');
    }
  }

  /**
   * Generates optimal placement zones within the constraint
   */
  private generatePlacementZones(contour: Contour): PlacementZone[] {
    const { paddingFromEdges } = this.requirements.logoPlacement;
    const { boundingRect } = contour;

    const zones: PlacementZone[] = [];

    // Central zone (highest quality)
    const centralPadding = paddingFromEdges * 1.5;
    const centralZone = {
      x: boundingRect.x + centralPadding,
      y: boundingRect.y + centralPadding,
      width: Math.max(0, boundingRect.width - (centralPadding * 2)),
      height: Math.max(0, boundingRect.height - (centralPadding * 2))
    };

    if (centralZone.width > 0 && centralZone.height > 0) {
      zones.push({
        id: 'center',
        region: centralZone,
        quality: 0.9,
        restrictions: [],
        suggestedLogoSize: {
          width: Math.round(centralZone.width * 0.8),
          height: Math.round(centralZone.height * 0.8)
        },
        centerPoint: {
          x: centralZone.x + centralZone.width / 2,
          y: centralZone.y + centralZone.height / 2
        }
      });
    }

    // Edge zones (lower quality but larger area)
    const edgeZone = {
      x: boundingRect.x + paddingFromEdges,
      y: boundingRect.y + paddingFromEdges,
      width: Math.max(0, boundingRect.width - (paddingFromEdges * 2)),
      height: Math.max(0, boundingRect.height - (paddingFromEdges * 2))
    };

    if (edgeZone.width > centralZone.width || edgeZone.height > centralZone.height) {
      zones.push({
        id: 'edge',
        region: edgeZone,
        quality: 0.7,
        restrictions: ['May be close to constraint boundaries'],
        suggestedLogoSize: {
          width: Math.round(edgeZone.width * 0.9),
          height: Math.round(edgeZone.height * 0.9)
        },
        centerPoint: {
          x: edgeZone.x + edgeZone.width / 2,
          y: edgeZone.y + edgeZone.height / 2
        }
      });
    }

    return zones;
  }

  /**
   * Calculates overall confidence score
   */
  private calculateConfidence(issues: ValidationIssue[], metrics: ConstraintValidationResult['metrics']): number {
    let confidence = 1.0;

    // Penalize for issues based on severity
    issues.forEach(issue => {
      const penalty = issue.severity.level === 'error' ? 0.3 :
                     issue.severity.level === 'warning' ? 0.15 : 0.05;
      confidence -= penalty * (issue.severity.priority / 10);
    });

    // Boost confidence for good metrics
    if (metrics.convexity > 0.8) confidence += 0.05;
    if (metrics.aspectRatio > 0.5 && metrics.aspectRatio < 2.0) confidence += 0.05;
    if (metrics.edgeDistance > 30) confidence += 0.03;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Helper methods for geometric calculations
   */
  private calculateEccentricity(contour: Contour): number {
    const { width, height } = contour.boundingRect;
    const maxDim = Math.max(width, height);
    const minDim = Math.min(width, height);
    return minDim > 0 ? 1 - (minDim / maxDim) : 1;
  }

  private calculateConvexHullArea(points: Array<{x: number; y: number}>): number {
    if (points.length < 3) return 0;

    // Use Graham scan to find convex hull
    const hull = this.grahamScan([...points]);
    
    // Calculate area using shoelace formula
    let area = 0;
    for (let i = 0; i < hull.length; i++) {
      const j = (i + 1) % hull.length;
      area += hull[i].x * hull[j].y;
      area -= hull[j].x * hull[i].y;
    }
    return Math.abs(area) / 2;
  }

  private grahamScan(points: Array<{x: number; y: number}>): Array<{x: number; y: number}> {
    if (points.length < 3) return points;

    // Find bottom-most point
    let start = points[0];
    for (const point of points) {
      if (point.y < start.y || (point.y === start.y && point.x < start.x)) {
        start = point;
      }
    }

    // Sort by polar angle
    const sorted = points
      .filter(p => p !== start)
      .sort((a, b) => {
        const angleA = Math.atan2(a.y - start.y, a.x - start.x);
        const angleB = Math.atan2(b.y - start.y, b.x - start.x);
        return angleA - angleB;
      });

    const hull = [start];
    for (const point of sorted) {
      while (hull.length > 1) {
        const p1 = hull[hull.length - 2];
        const p2 = hull[hull.length - 1];
        const crossProduct = (p2.x - p1.x) * (point.y - p1.y) - (p2.y - p1.y) * (point.x - p1.x);
        if (crossProduct > 0) break;
        hull.pop();
      }
      hull.push(point);
    }

    return hull;
  }

  /**
   * Creates result for empty/invalid constraints
   */
  private createEmptyResult(reason: string): ConstraintValidationResult {
    return {
      isValid: false,
      isUsable: false,
      confidence: 0,
      issues: [{
        id: 'no_constraint',
        severity: { level: 'error', blocking: true, priority: 10 },
        title: 'No constraint detected',
        description: reason,
        suggestion: 'Ensure green constraint areas are present and detectable',
        category: 'area'
      }],
      recommendations: [
        'Check color detection settings',
        'Verify green areas are present in the template',
        'Adjust color tolerance if needed'
      ],
      metrics: {
        area: 0,
        aspectRatio: 0,
        eccentricity: 0,
        convexity: 0,
        centerDistance: 0,
        edgeDistance: 0,
        logoCapacity: { min: 0, max: 0 }
      },
      placementZones: []
    };
  }

  /**
   * Updates validation requirements
   */
  updateRequirements(newRequirements: Partial<ConstraintRequirements>): void {
    this.requirements = { ...this.requirements, ...newRequirements };
  }

  /**
   * Gets current requirements
   */
  getRequirements(): ConstraintRequirements {
    return { ...this.requirements };
  }

  /**
   * Creates a validation report summary
   */
  createValidationReport(result: ConstraintValidationResult): string {
    const lines: string[] = [
      '=== CONSTRAINT VALIDATION REPORT ===',
      `Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`,
      `Usable: ${result.isUsable ? '✅ YES' : '❌ NO'}`,
      `Confidence: ${(result.confidence * 100).toFixed(1)}%`,
      '',
      '--- METRICS ---',
      `Area: ${Math.round(result.metrics.area)} pixels`,
      `Aspect Ratio: ${result.metrics.aspectRatio.toFixed(2)}`,
      `Convexity: ${result.metrics.convexity.toFixed(2)}`,
      `Edge Distance: ${Math.round(result.metrics.edgeDistance)}px`,
      `Logo Capacity: ${Math.round(result.metrics.logoCapacity.min)}-${Math.round(result.metrics.logoCapacity.max)}px`,
      ''
    ];

    if (result.issues.length > 0) {
      lines.push('--- ISSUES ---');
      result.issues.forEach(issue => {
        const icon = issue.severity.level === 'error' ? '❌' :
                    issue.severity.level === 'warning' ? '⚠️' : 'ℹ️';
        lines.push(`${icon} ${issue.title}: ${issue.description}`);
      });
      lines.push('');
    }

    if (result.recommendations.length > 0) {
      lines.push('--- RECOMMENDATIONS ---');
      result.recommendations.forEach(rec => {
        lines.push(`💡 ${rec}`);
      });
      lines.push('');
    }

    if (result.placementZones.length > 0) {
      lines.push('--- PLACEMENT ZONES ---');
      result.placementZones.forEach(zone => {
        lines.push(`📍 ${zone.id}: ${Math.round(zone.quality * 100)}% quality, ${zone.region.width}×${zone.region.height}px`);
      });
    }

    return lines.join('\n');
  }
}

// Export singleton instance
export const constraintValidationService = new ConstraintValidationService();

// Convenience functions
export function validateConstraint(
  mask: GeneratedMask,
  imageWidth: number,
  imageHeight: number,
  requirements?: Partial<ConstraintRequirements>
): ConstraintValidationResult {
  if (requirements) {
    constraintValidationService.updateRequirements(requirements);
  }
  return constraintValidationService.validateConstraint(mask, imageWidth, imageHeight);
}

export function createValidationReport(result: ConstraintValidationResult): string {
  return constraintValidationService.createValidationReport(result);
}