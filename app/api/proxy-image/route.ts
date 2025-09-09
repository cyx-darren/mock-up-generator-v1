import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  
  if (!imageUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  // Basic security: only allow specific domains
  const allowedDomains = [
    'images.unsplash.com',
    'unsplash.com',
    'cdn.jsdelivr.net',
    'i.imgur.com',
    'example.com'
  ];
  
  try {
    const url = new URL(imageUrl);
    const isAllowed = allowedDomains.some(domain => 
      url.hostname.includes(domain)
    );
    
    if (!isAllowed) {
      return new NextResponse('Domain not allowed', { status: 403 });
    }
  } catch (error) {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  try {
    // Fetch the external image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'MockupGen/1.0',
      },
    });
    
    if (!response.ok) {
      return new NextResponse(`Image fetch failed: ${response.statusText}`, { 
        status: response.status 
      });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return with proper CORS headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Internal proxy error', { status: 500 });
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}