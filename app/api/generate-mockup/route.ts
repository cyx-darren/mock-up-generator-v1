import { NextRequest, NextResponse } from 'next/server';
import { MockupGenerationPipeline } from '@/lib/mockup-generation-pipeline';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logo, product, placementType } = body;

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
      placementType
    });

    // Create pipeline instance
    const pipeline = new MockupGenerationPipeline();

    // Generate mockup with server-side constraint loading and default values
    const result = await pipeline.generateMockup({
      logo,
      product,
      placementType,
      qualityLevel: 'enhanced', // Default quality level
      stylePreferences: {}, // Default empty style preferences
    });

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {
    console.error('Mockup generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate mockup', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}