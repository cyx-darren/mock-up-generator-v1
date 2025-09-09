import { NextRequest, NextResponse } from 'next/server';
import { RemoveBgClient } from '@/lib/remove-bg';

export async function POST(request: NextRequest) {
  let file: File | null = null; // Fixed variable scope
  
  try {
    // Get the uploaded file from form data
    const formData = await request.formData();
    file = formData.get('image') as File;
    
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

    // Check if Remove.bg API key is available
    if (!process.env.REMOVE_BG_API_KEY) {
      // Fallback: return original image when API key is not configured
      console.warn('Remove.bg API key not configured, returning original image');
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      return NextResponse.json({
        success: true,
        processedImage: dataUrl,
        fallback: true,
        message: 'Background removal not available, using original image'
      });
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
    
    // If Remove.bg API fails, provide fallback with original image
    console.warn('Remove.bg API failed, returning original image as fallback');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      console.log('Fallback: Successfully created data URL, length:', dataUrl.length);

      return NextResponse.json({
        success: true,
        processedImage: dataUrl,
        fallback: true,
        message: 'Background removal service unavailable, using original image'
      });
    } catch (fallbackError) {
      console.error('Fallback processing failed:', fallbackError);
      return NextResponse.json(
        { error: 'Failed to process image even with fallback' },
        { status: 500 }
      );
    }
  }
}