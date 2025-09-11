import { NextRequest, NextResponse } from 'next/server';
import { MockupGenerationPipeline } from '@/lib/mockup-generation-pipeline';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logo, product, placementType, adjustments, adjustmentPrompt } = body;

    if (!logo || !product || !placementType) {
      return NextResponse.json(
        { error: 'Missing required fields: logo, product, placementType' },
        { status: 400 }
      );
    }

    console.log('Request data:', {
      logoFile: typeof logo.file,
      productId: product.id,
      productCategory: product.category,
      placementType,
      adjustments: adjustments || 'default',
      adjustmentPrompt: adjustmentPrompt || 'none',
    });

    // Create pipeline instance
    const pipeline = new MockupGenerationPipeline();

    // Handle adjustment prompts for AI-powered modifications
    const mockupRequest = {
      logo,
      product,
      placementType,
      qualityLevel: 'enhanced', // Default quality level
      stylePreferences: {}, // Default empty style preferences
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

    // Generate mockup with server-side constraint loading and adjustments
    const result = await pipeline.generateMockup(mockupRequest);

    return NextResponse.json({
      success: true,
      result,
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
