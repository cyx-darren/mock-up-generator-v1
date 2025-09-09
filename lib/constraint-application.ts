/**
 * Constraint Application System
 * Applies admin-configured constraints to ensure logos stay within designated areas
 */

// Types
export interface PlacementConstraint {
  id: string;
  item_id: string;
  placement_type: 'horizontal' | 'vertical' | 'all_over';
  is_validated: boolean;
  
  // Constraint image and detection
  constraint_image_url?: string;
  detected_area_pixels?: number;
  detected_area_percentage?: number;
  
  // Logo size limits
  min_logo_width?: number;
  max_logo_width?: number;
  min_logo_height?: number;
  max_logo_height?: number;
  
  // Default positioning
  default_x_position?: number;
  default_y_position?: number;
  
  // Guidelines and metadata
  guidelines_text?: string;
  pattern_settings?: any;
  created_at: string;
  updated_at: string;
  
  // Computed fields for compatibility
  constraint_x?: number;
  constraint_y?: number;
  constraint_width?: number;
  constraint_height?: number;
  default_x?: number;
  default_y?: number;
  default_width?: number;
  default_height?: number;
  margin_top?: number;
  margin_right?: number;
  margin_bottom?: number;
  margin_left?: number;
}

export interface LogoPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface ConstraintApplication {
  isValid: boolean;
  appliedPlacement: LogoPlacement;
  violations: string[];
  adjustments: string[];
  safetyMargins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ConstraintApplicationOptions {
  preferredPlacement?: LogoPlacement;
  placementType: 'horizontal' | 'vertical' | 'all_over';
  allowAutoAdjustment: boolean;
  respectSafetyMargins: boolean;
  enforceAspectRatio: boolean;
}

// Initialize Supabase client - use shared instance to avoid client-side env issues
import { supabase } from './supabase';

export class ConstraintApplicationService {
  /**
   * Load admin-configured constraints for a product
   */
  async loadConstraints(giftItemId: string): Promise<PlacementConstraint[]> {
    const { data, error } = await supabase
      .from('placement_constraints')
      .select('*')
      .eq('item_id', giftItemId)
      .eq('is_validated', true)
      .order('placement_type');

    if (error) {
      console.error('Error loading constraints:', error);
      throw new Error(`Failed to load constraints: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get constraint for specific placement type
   */
  async getConstraintForPlacement(
    giftItemId: string, 
    placementType: 'horizontal' | 'vertical' | 'all_over'
  ): Promise<PlacementConstraint | null> {
    const { data, error } = await supabase
      .from('placement_constraints')
      .select('*')
      .eq('item_id', giftItemId)
      .eq('placement_type', placementType)
      .eq('is_validated', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No matching constraint found
        return null;
      }
      console.error('Error loading constraint:', error);
      throw new Error(`Failed to load constraint: ${error.message}`);
    }

    return data;
  }

  /**
   * Apply constraints to logo placement
   */
  applyConstraints(
    constraint: PlacementConstraint,
    requestedPlacement: LogoPlacement,
    options: ConstraintApplicationOptions
  ): ConstraintApplication {
    const violations: string[] = [];
    const adjustments: string[] = [];
    let appliedPlacement = { ...requestedPlacement };

    // Apply safety margins
    const safetyMargins = this.applySafetyMargins(constraint, options.respectSafetyMargins);
    const effectiveConstraintArea = this.calculateEffectiveConstraintArea(constraint, safetyMargins);

    // Check and enforce boundary constraints
    const boundaryResult = this.enforceBoundaryConstraints(
      appliedPlacement,
      effectiveConstraintArea,
      constraint,
      options.allowAutoAdjustment
    );
    
    appliedPlacement = boundaryResult.placement;
    violations.push(...boundaryResult.violations);
    adjustments.push(...boundaryResult.adjustments);

    // Apply dimension restrictions
    const dimensionResult = this.applyDimensionRestrictions(
      appliedPlacement,
      constraint,
      options
    );
    
    appliedPlacement = dimensionResult.placement;
    violations.push(...dimensionResult.violations);
    adjustments.push(...dimensionResult.adjustments);

    // Use default position if no valid placement can be achieved
    if (violations.length > 0 && options.allowAutoAdjustment) {
      const defaultResult = this.useDefaultPosition(constraint, appliedPlacement);
      appliedPlacement = defaultResult.placement;
      adjustments.push(...defaultResult.adjustments);
      
      // Re-validate with default position
      const revalidation = this.validatePlacement(appliedPlacement, effectiveConstraintArea, constraint);
      if (revalidation.isValid) {
        // Clear violations if default position resolves them
        violations.length = 0;
      }
    }

    return {
      isValid: violations.length === 0,
      appliedPlacement,
      violations,
      adjustments,
      safetyMargins,
    };
  }

  /**
   * Apply safety margins to constraint area
   */
  private applySafetyMargins(
    constraint: PlacementConstraint,
    respectSafetyMargins: boolean
  ): { top: number; right: number; bottom: number; left: number } {
    if (!respectSafetyMargins) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    return {
      top: constraint.margin_top || 0,
      right: constraint.margin_right || 0,
      bottom: constraint.margin_bottom || 0,
      left: constraint.margin_left || 0,
    };
  }

  /**
   * Calculate effective constraint area after applying safety margins
   */
  private calculateEffectiveConstraintArea(
    constraint: PlacementConstraint,
    safetyMargins: { top: number; right: number; bottom: number; left: number }
  ): { x: number; y: number; width: number; height: number } {
    return {
      x: constraint.constraint_x + safetyMargins.left,
      y: constraint.constraint_y + safetyMargins.top,
      width: constraint.constraint_width - safetyMargins.left - safetyMargins.right,
      height: constraint.constraint_height - safetyMargins.top - safetyMargins.bottom,
    };
  }

  /**
   * Enforce boundary constraints
   */
  private enforceBoundaryConstraints(
    placement: LogoPlacement,
    effectiveArea: { x: number; y: number; width: number; height: number },
    constraint: PlacementConstraint,
    allowAutoAdjustment: boolean
  ): { placement: LogoPlacement; violations: string[]; adjustments: string[] } {
    const violations: string[] = [];
    const adjustments: string[] = [];
    const adjustedPlacement = { ...placement };

    // Check left boundary
    if (placement.x < effectiveArea.x) {
      violations.push(`Logo X position (${placement.x}) is outside left boundary (${effectiveArea.x})`);
      if (allowAutoAdjustment) {
        adjustedPlacement.x = effectiveArea.x;
        adjustments.push(`Adjusted X position from ${placement.x} to ${effectiveArea.x}`);
      }
    }

    // Check top boundary
    if (placement.y < effectiveArea.y) {
      violations.push(`Logo Y position (${placement.y}) is outside top boundary (${effectiveArea.y})`);
      if (allowAutoAdjustment) {
        adjustedPlacement.y = effectiveArea.y;
        adjustments.push(`Adjusted Y position from ${placement.y} to ${effectiveArea.y}`);
      }
    }

    // Check right boundary
    const logoRight = placement.x + placement.width;
    const areaRight = effectiveArea.x + effectiveArea.width;
    if (logoRight > areaRight) {
      violations.push(`Logo extends beyond right boundary (${logoRight} > ${areaRight})`);
      if (allowAutoAdjustment) {
        adjustedPlacement.x = areaRight - placement.width;
        adjustments.push(`Adjusted X position to fit within right boundary`);
      }
    }

    // Check bottom boundary
    const logoBottom = placement.y + placement.height;
    const areaBottom = effectiveArea.y + effectiveArea.height;
    if (logoBottom > areaBottom) {
      violations.push(`Logo extends beyond bottom boundary (${logoBottom} > ${areaBottom})`);
      if (allowAutoAdjustment) {
        adjustedPlacement.y = areaBottom - placement.height;
        adjustments.push(`Adjusted Y position to fit within bottom boundary`);
      }
    }

    return { placement: adjustedPlacement, violations, adjustments };
  }

  /**
   * Apply dimension restrictions
   */
  private applyDimensionRestrictions(
    placement: LogoPlacement,
    constraint: PlacementConstraint,
    options: ConstraintApplicationOptions
  ): { placement: LogoPlacement; violations: string[]; adjustments: string[] } {
    const violations: string[] = [];
    const adjustments: string[] = [];
    const adjustedPlacement = { ...placement };

    // Check minimum width
    if (placement.width < constraint.min_logo_width) {
      violations.push(`Logo width (${placement.width}) is below minimum (${constraint.min_logo_width})`);
      if (options.allowAutoAdjustment) {
        adjustedPlacement.width = constraint.min_logo_width;
        adjustments.push(`Adjusted width from ${placement.width} to ${constraint.min_logo_width}`);
        
        // Maintain aspect ratio if required
        if (options.enforceAspectRatio) {
          const aspectRatio = placement.width / placement.height;
          adjustedPlacement.height = adjustedPlacement.width / aspectRatio;
          adjustments.push(`Maintained aspect ratio, adjusted height to ${adjustedPlacement.height}`);
        }
      }
    }

    // Check maximum width
    if (placement.width > constraint.max_logo_width) {
      violations.push(`Logo width (${placement.width}) exceeds maximum (${constraint.max_logo_width})`);
      if (options.allowAutoAdjustment) {
        adjustedPlacement.width = constraint.max_logo_width;
        adjustments.push(`Adjusted width from ${placement.width} to ${constraint.max_logo_width}`);
        
        // Maintain aspect ratio if required
        if (options.enforceAspectRatio) {
          const aspectRatio = placement.width / placement.height;
          adjustedPlacement.height = adjustedPlacement.width / aspectRatio;
          adjustments.push(`Maintained aspect ratio, adjusted height to ${adjustedPlacement.height}`);
        }
      }
    }

    // Check minimum height
    if (placement.height < constraint.min_logo_height) {
      violations.push(`Logo height (${placement.height}) is below minimum (${constraint.min_logo_height})`);
      if (options.allowAutoAdjustment) {
        adjustedPlacement.height = constraint.min_logo_height;
        adjustments.push(`Adjusted height from ${placement.height} to ${constraint.min_logo_height}`);
        
        // Maintain aspect ratio if required
        if (options.enforceAspectRatio) {
          const aspectRatio = placement.width / placement.height;
          adjustedPlacement.width = adjustedPlacement.height * aspectRatio;
          adjustments.push(`Maintained aspect ratio, adjusted width to ${adjustedPlacement.width}`);
        }
      }
    }

    // Check maximum height
    if (placement.height > constraint.max_logo_height) {
      violations.push(`Logo height (${placement.height}) exceeds maximum (${constraint.max_logo_height})`);
      if (options.allowAutoAdjustment) {
        adjustedPlacement.height = constraint.max_logo_height;
        adjustments.push(`Adjusted height from ${placement.height} to ${constraint.max_logo_height}`);
        
        // Maintain aspect ratio if required
        if (options.enforceAspectRatio) {
          const aspectRatio = placement.width / placement.height;
          adjustedPlacement.width = adjustedPlacement.height * aspectRatio;
          adjustments.push(`Maintained aspect ratio, adjusted width to ${adjustedPlacement.width}`);
        }
      }
    }

    return { placement: adjustedPlacement, violations, adjustments };
  }

  /**
   * Use default position when constraints cannot be satisfied
   */
  private useDefaultPosition(
    constraint: PlacementConstraint,
    currentPlacement: LogoPlacement
  ): { placement: LogoPlacement; adjustments: string[] } {
    const adjustments: string[] = [];
    
    const defaultPlacement: LogoPlacement = {
      x: constraint.default_x,
      y: constraint.default_y,
      width: constraint.default_width,
      height: constraint.default_height,
      rotation: currentPlacement.rotation,
    };

    adjustments.push(`Applied default position: (${constraint.default_x}, ${constraint.default_y})`);
    adjustments.push(`Applied default size: ${constraint.default_width}x${constraint.default_height}`);

    return { placement: defaultPlacement, adjustments };
  }

  /**
   * Validate placement against constraint area
   */
  private validatePlacement(
    placement: LogoPlacement,
    effectiveArea: { x: number; y: number; width: number; height: number },
    constraint: PlacementConstraint
  ): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check boundaries
    if (placement.x < effectiveArea.x) {
      violations.push('Logo extends beyond left boundary');
    }
    if (placement.y < effectiveArea.y) {
      violations.push('Logo extends beyond top boundary');
    }
    if (placement.x + placement.width > effectiveArea.x + effectiveArea.width) {
      violations.push('Logo extends beyond right boundary');
    }
    if (placement.y + placement.height > effectiveArea.y + effectiveArea.height) {
      violations.push('Logo extends beyond bottom boundary');
    }

    // Check dimensions
    if (placement.width < constraint.min_logo_width) {
      violations.push('Logo width below minimum');
    }
    if (placement.width > constraint.max_logo_width) {
      violations.push('Logo width exceeds maximum');
    }
    if (placement.height < constraint.min_logo_height) {
      violations.push('Logo height below minimum');
    }
    if (placement.height > constraint.max_logo_height) {
      violations.push('Logo height exceeds maximum');
    }

    return { isValid: violations.length === 0, violations };
  }

  /**
   * Generate placement mask for AI generation
   */
  generatePlacementMask(
    constraint: PlacementConstraint,
    appliedPlacement: LogoPlacement,
    productImageWidth: number,
    productImageHeight: number
  ): {
    maskData: string; // Base64 encoded mask image
    placementInfo: {
      normalizedX: number; // 0-1 coordinate
      normalizedY: number; // 0-1 coordinate
      normalizedWidth: number; // 0-1 size
      normalizedHeight: number; // 0-1 size
    };
  } {
    // Create canvas for mask generation
    const canvas = document.createElement('canvas');
    canvas.width = productImageWidth;
    canvas.height = productImageHeight;
    const ctx = canvas.getContext('2d')!;

    // Fill with black (no placement)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, productImageWidth, productImageHeight);

    // Draw white rectangle for logo placement area
    ctx.fillStyle = 'white';
    ctx.fillRect(
      appliedPlacement.x,
      appliedPlacement.y,
      appliedPlacement.width,
      appliedPlacement.height
    );

    // Convert to base64
    const maskData = canvas.toDataURL('image/png').split(',')[1];

    // Calculate normalized coordinates for AI model
    const placementInfo = {
      normalizedX: appliedPlacement.x / productImageWidth,
      normalizedY: appliedPlacement.y / productImageHeight,
      normalizedWidth: appliedPlacement.width / productImageWidth,
      normalizedHeight: appliedPlacement.height / productImageHeight,
    };

    return { maskData, placementInfo };
  }

  /**
   * Get recommended placement for a product
   */
  async getRecommendedPlacement(
    giftItemId: string,
    placementType: 'horizontal' | 'vertical' | 'all_over',
    logoAspectRatio?: number
  ): Promise<LogoPlacement | null> {
    const constraint = await this.getConstraintForPlacement(giftItemId, placementType);
    
    if (!constraint) {
      return null;
    }

    // Start with default placement
    let recommendedPlacement: LogoPlacement = {
      x: constraint.default_x,
      y: constraint.default_y,
      width: constraint.default_width,
      height: constraint.default_height,
    };

    // Adjust for logo aspect ratio if provided
    if (logoAspectRatio) {
      const currentAspectRatio = recommendedPlacement.width / recommendedPlacement.height;
      
      if (Math.abs(currentAspectRatio - logoAspectRatio) > 0.1) {
        // Adjust size to match logo aspect ratio while staying within constraints
        if (logoAspectRatio > currentAspectRatio) {
          // Logo is wider, adjust width
          recommendedPlacement.width = Math.min(
            recommendedPlacement.height * logoAspectRatio,
            constraint.max_logo_width
          );
        } else {
          // Logo is taller, adjust height
          recommendedPlacement.height = Math.min(
            recommendedPlacement.width / logoAspectRatio,
            constraint.max_logo_height
          );
        }
      }
    }

    return recommendedPlacement;
  }

  /**
   * Batch apply constraints to multiple placements
   */
  async batchApplyConstraints(
    giftItemId: string,
    placements: Array<{
      type: 'horizontal' | 'vertical' | 'all_over';
      placement: LogoPlacement;
      options: ConstraintApplicationOptions;
    }>
  ): Promise<Array<ConstraintApplication & { type: string }>> {
    const constraints = await this.loadConstraints(giftItemId);
    const results: Array<ConstraintApplication & { type: string }> = [];

    for (const { type, placement, options } of placements) {
      const constraint = constraints.find(c => c.placement_type === type);
      
      if (constraint) {
        const result = this.applyConstraints(constraint, placement, options);
        results.push({ ...result, type });
      } else {
        results.push({
          type,
          isValid: false,
          appliedPlacement: placement,
          violations: [`No constraint configured for placement type: ${type}`],
          adjustments: [],
          safetyMargins: { top: 0, right: 0, bottom: 0, left: 0 },
        });
      }
    }

    return results;
  }
}

// Singleton instance
let constraintService: ConstraintApplicationService | null = null;

export function getConstraintApplicationService(): ConstraintApplicationService {
  if (!constraintService) {
    constraintService = new ConstraintApplicationService();
  }
  return constraintService;
}

export default ConstraintApplicationService;