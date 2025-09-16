import { NextRequest, NextResponse } from 'next/server';
import { MockupGenerationPipeline } from '@/lib/mockup-generation-pipeline';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      logo,
      frontLogo,
      backLogo,
      product,
      placementType,
      side = 'front',
      adjustments,
      adjustmentPrompt,
    } = body;

    // Handle both legacy single-sided and new dual-sided requests
    const hasLegacyLogo = !!logo;
    const hasFrontLogo = !!frontLogo;
    const hasBackLogo = !!backLogo;

    // Validation for different request types
    if (side === 'both') {
      // Dual-sided request - need both logos
      if (!hasFrontLogo || !hasBackLogo || !product || !placementType) {
        return NextResponse.json(
          {
            error:
              'For dual-sided generation: Missing required fields: frontLogo, backLogo, product, placementType',
          },
          { status: 400 }
        );
      }
    } else if (side === 'back') {
      // Back-only request
      if (!(hasBackLogo || hasLegacyLogo) || !product || !placementType) {
        return NextResponse.json(
          {
            error:
              'For back-side generation: Missing required fields: backLogo (or logo), product, placementType',
          },
          { status: 400 }
        );
      }
    } else {
      // Front-only request (default/legacy)
      if (!(hasFrontLogo || hasLegacyLogo) || !product || !placementType) {
        return NextResponse.json(
          {
            error:
              'For front-side generation: Missing required fields: frontLogo (or logo), product, placementType',
          },
          { status: 400 }
        );
      }
    }

    console.log('Request data:', {
      logoFile: hasLegacyLogo ? typeof logo.file : 'none',
      frontLogoFile: hasFrontLogo ? typeof frontLogo.file : 'none',
      backLogoFile: hasBackLogo ? typeof backLogo.file : 'none',
      productId: product.id,
      productCategory: product.category,
      placementType,
      side,
      adjustments: adjustments || 'default',
      adjustmentPrompt: adjustmentPrompt || 'none',
    });

    // Create pipeline instance
    const pipeline = new MockupGenerationPipeline();

    // Handle dual-sided generation
    if (side === 'both') {
      const dualSidedRequest = {
        frontLogo,
        backLogo,
        product,
        placementType,
        qualityLevel: 'enhanced' as const,
        stylePreferences: {},
        adjustments: typeof adjustments === 'string' ? undefined : adjustments,
      };

      // Add adjustment prompts
      if (typeof adjustments === 'string' && adjustments) {
        dualSidedRequest.additionalRequirements = [adjustments];
      }
      if (adjustmentPrompt) {
        dualSidedRequest.additionalRequirements = dualSidedRequest.additionalRequirements || [];
        dualSidedRequest.additionalRequirements.push(adjustmentPrompt);
      }

      const result = await pipeline.generateDualSidedMockup(dualSidedRequest);

      return NextResponse.json({
        success: true,
        result: {
          front: result.frontImageUrl,
          back: result.backImageUrl,
          side: 'both',
        },
      });
    }

    // Handle single-sided generation (front or back)
    const effectiveLogo = side === 'back' ? backLogo || logo : frontLogo || logo;

    const mockupRequest = {
      logo: effectiveLogo,
      product,
      placementType,
      side,
      qualityLevel: 'enhanced' as const,
      stylePreferences: {},
      adjustments:
        typeof adjustments === 'string'
          ? undefined
          : adjustments || {
              scale: 1.0,
              rotation: 0,
              x: 0.5,
              y: 0.5,
              flipH: false,
              flipV: false,
              opacity: 1.0,
            },
    };

    // If adjustments is a string (adjustment prompt), add it to additional requirements
    if (typeof adjustments === 'string' && adjustments) {
      mockupRequest.additionalRequirements = [adjustments];
    }
    if (adjustmentPrompt) {
      mockupRequest.additionalRequirements = mockupRequest.additionalRequirements || [];
      mockupRequest.additionalRequirements.push(adjustmentPrompt);
    }

    // Generate single-sided mockup
    const result = await pipeline.generateMockup(mockupRequest);

    return NextResponse.json({
      success: true,
      result,
      side,
    });
  } catch (error) {
    console.error('Mockup generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate mockup',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
