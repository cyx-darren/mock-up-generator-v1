import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { image: string } }
) {
  const { image } = params;
  
  // Create a simple colored rectangle as placeholder
  const width = 400;
  const height = 300;
  
  // Different colors for different images
  const colors: Record<string, string> = {
    'logo.png': '#2563eb',
    'mug.png': '#f3f4f6',
    'tshirt.png': '#ef4444',
    'pen.png': '#10b981',
    'notebook.png': '#f59e0b',
    'tote_bag.png': '#8b5cf6'
  };
  
  const color = colors[image] || '#6b7280';
  
  // Create SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}" opacity="0.3"/>
      <text x="50%" y="45%" dominant-baseline="central" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="16" fill="${color}">
        ${image.replace('.png', '').toUpperCase()}
      </text>
      <text x="50%" y="55%" dominant-baseline="central" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="12" fill="${color}" opacity="0.8">
        ${width}×${height} placeholder
      </text>
    </svg>
  `;
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}