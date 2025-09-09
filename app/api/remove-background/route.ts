import { NextRequest, NextResponse } from 'next/server';
import { RemoveBgClient } from '@/lib/remove-bg';

export async function POST(request: NextRequest) {
  try {
    // Get the uploaded file from form data
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Check if file type is supported by Remove.bg
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
    if (!supportedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: `File type ${file.type} is not supported. Please use JPEG, PNG, WebP, or HEIC format.` },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Initialize Remove.bg client with API key from environment
    const removeBgClient = new RemoveBgClient(process.env.REMOVE_BG_API_KEY);
    
    // Process the image
    const result = await removeBgClient.removeBackground(file);
    
    // Convert blob to base64 for client transmission
    const arrayBuffer = await result.data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({
      success: true,
      processedImage: dataUrl,
      metadata: result.result
    });

  } catch (error) {
    console.error('Background removal error:', error);
    
    // Return specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Background removal service configuration error' },
          { status: 500 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Background removal service temporarily unavailable' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}