import { NextRequest, NextResponse } from 'next/server';
import { removeBackgroundFromFile, getRemoveBgUsageStats, isRemoveBgError } from '@/lib/remove-bg';
import { backgroundRemovalService, BackgroundRemovalOptions } from '@/lib/background-removal';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const size = (formData.get('size') as string) || 'preview';
    const format = (formData.get('format') as string) || 'png';
    const userId = (formData.get('userId') as string) || undefined;

    // Enhanced options
    const enableCache = formData.get('enableCache') === 'true';
    const smoothing = parseInt(formData.get('smoothing') as string) || 0;
    const feathering = parseInt(formData.get('feathering') as string) || 0;
    const edgeRefinement = formData.get('edgeRefinement') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log(`Processing background removal for file: ${file.name} (${file.size} bytes)`);

    // Prepare enhanced options
    const options: BackgroundRemovalOptions = {
      quality: {
        size: size as any,
        format: format as any,
        channels: 'rgba',
        semitransparency: true,
      },
      enableCache,
      edgeRefinement: edgeRefinement
        ? {
            enabled: true,
            smoothing,
            feathering,
            threshold: 128,
          }
        : undefined,
      retryAttempts: 2,
      timeout: 30000,
    };

    const result = await backgroundRemovalService.removeBackground(file, options, userId);

    // Convert blob to buffer for response
    const buffer = await result.data.arrayBuffer();

    // Return the processed image and enhanced metadata
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'X-Detected-Type': result.detectedType || 'unknown',
        'X-Width': result.result?.width?.toString() || '0',
        'X-Height': result.result?.height?.toString() || '0',
        'X-Credits-Charged': result.result?.credits_charged?.toString() || '0',
        'X-Processing-Time': result.processingTime.toString(),
        'X-From-Cache': result.fromCache.toString(),
        'X-Original-Size': result.originalSize.toString(),
        'X-Processed-Size': result.processedSize.toString(),
        'X-Has-Transparency': result.metadata.hasTransparency.toString(),
        'X-Edge-Quality': result.metadata.edgeQuality,
      },
    });
  } catch (error) {
    console.error('Background removal error:', error);

    if (isRemoveBgError(error)) {
      return NextResponse.json(
        {
          error: error.title,
          detail: error.detail,
          code: error.code,
        },
        { status: error.status }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const stats = getRemoveBgUsageStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Usage stats error:', error);
    return NextResponse.json({ error: 'Failed to retrieve usage stats' }, { status: 500 });
  }
}
