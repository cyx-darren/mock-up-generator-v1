/**
 * Prompt Engineering System
 * Advanced prompt generation for corporate gift mockup generation
 */

export interface PromptTemplate {
  id: string;
  name: string;
  baseTemplate: string;
  variables: string[];
  category: 'base' | 'product' | 'placement' | 'quality' | 'style';
}

export interface PromptVariation {
  id: string;
  name: string;
  description: string;
  modifiers: string[];
  weight: number; // For A/B testing
}

export interface ProductPrompt {
  productType: string;
  specificPrompts: {
    description: string;
    materials: string[];
    context: string;
    branding: string;
  };
}

export interface PlacementVariation {
  type: 'horizontal' | 'vertical' | 'all-over' | 'corner' | 'center';
  prompt: string;
  constraints: string[];
}

export interface QualityModifier {
  level: 'basic' | 'enhanced' | 'premium' | 'ultra';
  modifiers: string[];
  aspectRatio?: string;
  resolution?: string;
}

export interface StyleParameter {
  category: 'lighting' | 'angle' | 'background' | 'mood' | 'aesthetic';
  options: {
    name: string;
    prompt: string;
    description: string;
  }[];
}

export interface PromptGenerationRequest {
  productType: string;
  placementType: PlacementVariation['type'];
  qualityLevel: QualityModifier['level'];
  stylePreferences: {
    lighting?: string;
    angle?: string;
    background?: string;
    mood?: string;
    aesthetic?: string;
  };
  customText?: string;
  brandColors?: string[];
  additionalRequirements?: string[];
}

export interface GeneratedPrompt {
  finalPrompt: string;
  components: {
    basePrompt: string;
    productPrompt: string;
    placementPrompt: string;
    qualityModifiers: string[];
    styleModifiers: string[];
  };
  metadata: {
    variation: string;
    confidence: number;
    estimatedTokens: number;
  };
}

export class PromptEngineeringService {
  private baseTemplates: Map<string, PromptTemplate> = new Map();
  private productPrompts: Map<string, ProductPrompt> = new Map();
  private placementVariations: Map<string, PlacementVariation> = new Map();
  private qualityModifiers: Map<string, QualityModifier> = new Map();
  private styleParameters: Map<string, StyleParameter> = new Map();
  private abTestVariations: PromptVariation[] = [];

  constructor() {
    this.initializeTemplates();
    this.initializeProductPrompts();
    this.initializePlacementVariations();
    this.initializeQualityModifiers();
    this.initializeStyleParameters();
    this.initializeABTestVariations();
  }

  /**
   * Base Prompt Templates
   */
  private initializeTemplates(): void {
    const baseTemplate: PromptTemplate = {
      id: 'corporate-gift-base',
      name: 'Corporate Gift Base Template',
      baseTemplate: `Create a professional, high-quality mockup of a {productType} as a corporate gift. The design should be clean, modern, and suitable for business branding. {qualityModifiers} {styleModifiers} {placementModifiers} The mockup should showcase the product in an appealing way that demonstrates its potential as a branded corporate gift.`,
      variables: ['productType', 'qualityModifiers', 'styleModifiers', 'placementModifiers'],
      category: 'base'
    };

    this.baseTemplates.set(baseTemplate.id, baseTemplate);

    // Alternative base templates for A/B testing
    const alternativeBase: PromptTemplate = {
      id: 'corporate-gift-premium',
      name: 'Premium Corporate Gift Template',
      baseTemplate: `Generate an elegant, premium mockup showcasing a {productType} designed for corporate gifting. Focus on luxury presentation and professional branding opportunities. {qualityModifiers} {styleModifiers} {placementModifiers} The result should convey quality and sophistication suitable for executive gifts.`,
      variables: ['productType', 'qualityModifiers', 'styleModifiers', 'placementModifiers'],
      category: 'base'
    };

    this.baseTemplates.set(alternativeBase.id, alternativeBase);
  }

  /**
   * Product-Specific Prompts
   */
  private initializeProductPrompts(): void {
    const productPrompts: ProductPrompt[] = [
      {
        productType: 'mug',
        specificPrompts: {
          description: 'ceramic coffee mug with smooth finish',
          materials: ['ceramic', 'porcelain', 'high-quality glazed finish'],
          context: 'office environment, coffee break, professional setting',
          branding: 'logo placement on side, handle visible, rim clean'
        }
      },
      {
        productType: 'tshirt',
        specificPrompts: {
          description: 'premium cotton t-shirt with professional fit',
          materials: ['100% cotton', 'soft fabric texture', 'wrinkle-free appearance'],
          context: 'casual office wear, team building, company events',
          branding: 'logo on chest area, clean print application, size appropriate'
        }
      },
      {
        productType: 'pen',
        specificPrompts: {
          description: 'elegant ballpoint pen with metallic finish',
          materials: ['metal body', 'smooth writing tip', 'comfortable grip'],
          context: 'business meetings, desk accessories, professional writing',
          branding: 'engraved or printed logo, subtle placement, readable text'
        }
      },
      {
        productType: 'notebook',
        specificPrompts: {
          description: 'professional bound notebook with clean cover',
          materials: ['quality paper', 'durable binding', 'smooth cover surface'],
          context: 'meetings, note-taking, office supplies',
          branding: 'logo on front cover, embossed or printed, professional layout'
        }
      },
      {
        productType: 'tote_bag',
        specificPrompts: {
          description: 'canvas tote bag with sturdy construction',
          materials: ['canvas fabric', 'reinforced handles', 'durable stitching'],
          context: 'conferences, shopping, daily use, eco-friendly option',
          branding: 'large logo area, screen printing or embroidery, visible placement'
        }
      }
    ];

    productPrompts.forEach(prompt => {
      this.productPrompts.set(prompt.productType, prompt);
    });
  }

  /**
   * Placement Variations
   */
  private initializePlacementVariations(): void {
    const placements: PlacementVariation[] = [
      {
        type: 'horizontal',
        prompt: 'with logo placed horizontally across the center, maintaining readable proportions and professional spacing',
        constraints: ['logo width should not exceed 60% of available space', 'maintain aspect ratio', 'ensure readability']
      },
      {
        type: 'vertical',
        prompt: 'with logo positioned vertically along the side or in a tall format, creating elegant vertical branding',
        constraints: ['logo height appropriate to product', 'maintain vertical alignment', 'ensure visibility']
      },
      {
        type: 'all-over',
        prompt: 'with branding pattern repeated across the entire surface, creating a cohesive branded design',
        constraints: ['pattern should be balanced', 'avoid overcrowding', 'maintain brand consistency']
      },
      {
        type: 'corner',
        prompt: 'with logo subtly placed in the corner, creating a sophisticated and understated branded look',
        constraints: ['corner placement should be visible', 'size appropriate for corner space', 'maintain elegance']
      },
      {
        type: 'center',
        prompt: 'with logo prominently centered, creating a bold and professional branded statement',
        constraints: ['perfect center alignment', 'appropriate size for prominence', 'balanced composition']
      }
    ];

    placements.forEach(placement => {
      this.placementVariations.set(placement.type, placement);
    });
  }

  /**
   * Quality Modifiers
   */
  private initializeQualityModifiers(): void {
    const qualities: QualityModifier[] = [
      {
        level: 'basic',
        modifiers: ['clean appearance', 'simple lighting', 'basic composition'],
        aspectRatio: '1:1',
        resolution: 'standard'
      },
      {
        level: 'enhanced',
        modifiers: ['professional lighting', 'detailed textures', 'refined composition', 'subtle shadows'],
        aspectRatio: '4:3',
        resolution: 'high'
      },
      {
        level: 'premium',
        modifiers: ['studio lighting', 'ultra-detailed textures', 'sophisticated composition', 'perfect shadows', 'color accuracy'],
        aspectRatio: '16:9',
        resolution: 'ultra-high'
      },
      {
        level: 'ultra',
        modifiers: ['cinematic lighting', 'photorealistic detail', 'artistic composition', 'dynamic shadows', 'perfect color grading', '8K quality'],
        aspectRatio: '21:9',
        resolution: '8K'
      }
    ];

    qualities.forEach(quality => {
      this.qualityModifiers.set(quality.level, quality);
    });
  }

  /**
   * Style Parameters
   */
  private initializeStyleParameters(): void {
    const styles: StyleParameter[] = [
      {
        category: 'lighting',
        options: [
          {
            name: 'natural',
            prompt: 'soft natural lighting with gentle shadows',
            description: 'Mimics daylight for authentic appearance'
          },
          {
            name: 'studio',
            prompt: 'professional studio lighting with controlled shadows',
            description: 'Clean, professional product photography style'
          },
          {
            name: 'dramatic',
            prompt: 'dramatic lighting with strong contrasts and deep shadows',
            description: 'Creates visual impact and premium feel'
          }
        ]
      },
      {
        category: 'angle',
        options: [
          {
            name: 'front',
            prompt: 'straight-on front view showcasing the main branding area',
            description: 'Direct view of primary logo placement'
          },
          {
            name: 'three-quarter',
            prompt: '3/4 angle view showing depth and dimension',
            description: 'Adds depth while maintaining brand visibility'
          },
          {
            name: 'overhead',
            prompt: 'overhead flat lay view for modern presentation',
            description: 'Contemporary style popular in social media'
          }
        ]
      },
      {
        category: 'background',
        options: [
          {
            name: 'white',
            prompt: 'clean white background for product focus',
            description: 'Professional, distraction-free presentation'
          },
          {
            name: 'context',
            prompt: 'realistic office or business environment background',
            description: 'Shows product in natural usage context'
          },
          {
            name: 'gradient',
            prompt: 'subtle gradient background in brand colors',
            description: 'Adds visual interest while maintaining professionalism'
          }
        ]
      },
      {
        category: 'mood',
        options: [
          {
            name: 'professional',
            prompt: 'serious, professional mood suitable for corporate environments',
            description: 'Conservative approach for traditional businesses'
          },
          {
            name: 'modern',
            prompt: 'contemporary, sleek mood with clean lines',
            description: 'Appeals to modern, tech-forward companies'
          },
          {
            name: 'warm',
            prompt: 'warm, inviting mood that feels approachable',
            description: 'Humanizes the corporate gift experience'
          }
        ]
      },
      {
        category: 'aesthetic',
        options: [
          {
            name: 'minimal',
            prompt: 'minimalist aesthetic with clean, simple composition',
            description: 'Less is more approach'
          },
          {
            name: 'luxury',
            prompt: 'luxury aesthetic with premium finishes and elegant presentation',
            description: 'High-end corporate gift positioning'
          },
          {
            name: 'creative',
            prompt: 'creative aesthetic with artistic elements and unique presentation',
            description: 'For creative industries and innovative companies'
          }
        ]
      }
    ];

    styles.forEach(style => {
      this.styleParameters.set(style.category, style);
    });
  }

  /**
   * A/B Testing Variations
   */
  private initializeABTestVariations(): void {
    this.abTestVariations = [
      {
        id: 'variation-a-standard',
        name: 'Standard Corporate',
        description: 'Traditional professional approach',
        modifiers: ['professional', 'clean', 'traditional'],
        weight: 0.4
      },
      {
        id: 'variation-b-modern',
        name: 'Modern Minimal',
        description: 'Contemporary minimalist style',
        modifiers: ['modern', 'minimal', 'sleek'],
        weight: 0.3
      },
      {
        id: 'variation-c-premium',
        name: 'Premium Luxury',
        description: 'High-end luxury presentation',
        modifiers: ['luxury', 'premium', 'sophisticated'],
        weight: 0.3
      }
    ];
  }

  /**
   * Generate Complete Prompt
   */
  generatePrompt(request: PromptGenerationRequest): GeneratedPrompt {
    const baseTemplate = this.baseTemplates.get('corporate-gift-base');
    const productPrompt = this.productPrompts.get(request.productType);
    const placementVariation = this.placementVariations.get(request.placementType);
    const qualityModifier = this.qualityModifiers.get(request.qualityLevel);

    if (!baseTemplate || !productPrompt || !placementVariation || !qualityModifier) {
      throw new Error('Required prompt components not found');
    }

    // Build product-specific description
    const productDescription = `${productPrompt.specificPrompts.description} with ${productPrompt.specificPrompts.materials.join(', ')}`;

    // Build quality modifiers string
    const qualityModifiersStr = qualityModifier.modifiers.join(', ');

    // Build style modifiers
    const styleModifiers: string[] = [];
    Object.entries(request.stylePreferences).forEach(([category, option]) => {
      const styleParam = this.styleParameters.get(category);
      if (styleParam && option) {
        const styleOption = styleParam.options.find(opt => opt.name === option);
        if (styleOption) {
          styleModifiers.push(styleOption.prompt);
        }
      }
    });

    const styleModifiersStr = styleModifiers.join(', ');

    // Build placement modifiers
    const placementModifiersStr = placementVariation.prompt;

    // Replace template variables
    let finalPrompt = baseTemplate.baseTemplate
      .replace('{productType}', productDescription)
      .replace('{qualityModifiers}', qualityModifiersStr)
      .replace('{styleModifiers}', styleModifiersStr)
      .replace('{placementModifiers}', placementModifiersStr);

    // Add custom text if provided
    if (request.customText) {
      finalPrompt += ` Include the text "${request.customText}" in the branding.`;
    }

    // Add brand colors if provided
    if (request.brandColors && request.brandColors.length > 0) {
      finalPrompt += ` Use brand colors: ${request.brandColors.join(', ')}.`;
    }

    // Add additional requirements
    if (request.additionalRequirements && request.additionalRequirements.length > 0) {
      finalPrompt += ` Additional requirements: ${request.additionalRequirements.join(', ')}.`;
    }

    // Calculate metadata
    const estimatedTokens = this.estimateTokens(finalPrompt);
    const confidence = this.calculateConfidence(request);

    return {
      finalPrompt,
      components: {
        basePrompt: baseTemplate.baseTemplate,
        productPrompt: productDescription,
        placementPrompt: placementModifiersStr,
        qualityModifiers: qualityModifier.modifiers,
        styleModifiers: styleModifiers
      },
      metadata: {
        variation: 'standard',
        confidence,
        estimatedTokens
      }
    };
  }

  /**
   * Generate A/B Test Variations
   */
  generateABTestVariations(request: PromptGenerationRequest): GeneratedPrompt[] {
    const variations: GeneratedPrompt[] = [];

    for (const variation of this.abTestVariations) {
      const modifiedRequest = {
        ...request,
        additionalRequirements: [
          ...(request.additionalRequirements || []),
          ...variation.modifiers
        ]
      };

      const prompt = this.generatePrompt(modifiedRequest);
      prompt.metadata.variation = variation.id;

      variations.push(prompt);
    }

    return variations;
  }

  /**
   * Get Available Options
   */
  getAvailableProductTypes(): string[] {
    return Array.from(this.productPrompts.keys());
  }

  getAvailablePlacementTypes(): PlacementVariation['type'][] {
    return Array.from(this.placementVariations.keys()) as PlacementVariation['type'][];
  }

  getAvailableQualityLevels(): QualityModifier['level'][] {
    return Array.from(this.qualityModifiers.keys()) as QualityModifier['level'][];
  }

  getStyleOptions(category: StyleParameter['category']): StyleParameter['options'] {
    const style = this.styleParameters.get(category);
    return style ? style.options : [];
  }

  /**
   * Utility Methods
   */
  private estimateTokens(prompt: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(prompt.length / 4);
  }

  private calculateConfidence(request: PromptGenerationRequest): number {
    let confidence = 0.8; // Base confidence

    // Increase confidence if we have all required components
    if (this.productPrompts.has(request.productType)) confidence += 0.1;
    if (this.placementVariations.has(request.placementType)) confidence += 0.05;
    if (this.qualityModifiers.has(request.qualityLevel)) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }
}

// Singleton instance
let promptService: PromptEngineeringService | null = null;

export function getPromptEngineeringService(): PromptEngineeringService {
  if (!promptService) {
    promptService = new PromptEngineeringService();
  }
  return promptService;
}

export default PromptEngineeringService;