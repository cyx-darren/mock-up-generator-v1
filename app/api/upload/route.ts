import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename with better sanitization
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    const sanitizedName = baseName
      .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special chars with underscore
      .replace(/_+/g, '_') // Replace multiple underscores with single one
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    const filename = `${timestamp}-${sanitizedName}.${fileExtension.toLowerCase()}`;

    // Get bucket name from query parameter or default to 'gift-items'
    const url = new URL(request.url);
    const bucket = url.searchParams.get('bucket') || 'gift-items';

    // Upload to Supabase Storage
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    const { data, error } = await supabaseAdmin.storage.from(bucket).upload(filename, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(filename);

    const fileUrl = urlData.publicUrl;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename: filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
