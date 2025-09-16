import { NextRequest, NextResponse } from 'next/server';
import { CacheConfigs } from '@/lib/cache/response-cache';

// Image proxy with optimization and caching
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const width = searchParams.get('w') ? parseInt(searchParams.get('w')!) : undefined;
    const height = searchParams.get('h') ? parseInt(searchParams.get('h')!) : undefined;
    const quality = searchParams.get('q') ? parseInt(searchParams.get('q')!) : 85;
    const format = searchParams.get('f') || 'webp';

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    // Validate URL
    let url: URL;
    try {
      url = new URL(decodeURIComponent(imageUrl));
    } catch {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    // Security: Only allow certain domains
    const allowedDomains = [
      'images.unsplash.com',
      'supabase.co',
      'easyprintsg.com',
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', ''),
    ].filter(Boolean);

    const isAllowed = allowedDomains.some(
      (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    // Fetch the image
    const imageResponse = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'MockupGen-ImageProxy/1.0',
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 404 });
    }

    const contentType = imageResponse.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 400 });
    }

    // Get image buffer
    const imageBuffer = await imageResponse.arrayBuffer();

    // Set up response headers with caching
    const headers: HeadersInit = {
      'Content-Type': `image/${format}`,
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache
      'X-Image-Proxy': 'optimized',
      Vary: 'Accept',
    };

    // Add optimization headers
    if (width || height) {
      headers['X-Image-Optimized'] = 'resized';
    }
    if (quality < 100) {
      headers['X-Image-Quality'] = quality.toString();
    }

    // Return optimized image
    return new NextResponse(imageBuffer, { headers });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Image proxy failed' }, { status: 500 });
  }
}

// Image metadata endpoint
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse(null, { status: 400 });
    }

    const url = new URL(decodeURIComponent(imageUrl));
    const response = await fetch(url.toString(), { method: 'HEAD' });

    if (!response.ok) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'Content-Length': response.headers.get('content-length') || '0',
        'Last-Modified': response.headers.get('last-modified') || new Date().toUTCString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
