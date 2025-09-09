/**
 * Server-side image processing utilities using node-canvas
 */
import { createCanvas, loadImage, Canvas, CanvasRenderingContext2D } from 'canvas';

export interface ImageCombineOptions {
  productImageUrl: string;
  logoImageUrl: string;
  logoPlacement: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  outputWidth?: number;
  outputHeight?: number;
}

/**
 * Combine product and logo images server-side
 */
export async function combineImages(options: ImageCombineOptions): Promise<string> {
  const { productImageUrl, logoImageUrl, logoPlacement, outputWidth, outputHeight } = options;

  try {
    console.log('Loading product image from:', productImageUrl);
    // Load product image first to get its dimensions
    const productImg = await loadImage(productImageUrl);
    console.log(
      'Product image loaded successfully, dimensions:',
      productImg.width,
      'x',
      productImg.height
    );

    // Use original product image dimensions if not specified
    const canvasWidth = outputWidth || productImg.width;
    const canvasHeight = outputHeight || productImg.height;

    // Create canvas with product image dimensions
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Draw product image at original size (no scaling)
    ctx.drawImage(productImg, 0, 0, canvasWidth, canvasHeight);

    console.log(
      'Loading logo image from:',
      logoImageUrl.startsWith('data:') ? `data URL (${logoImageUrl.length} chars)` : logoImageUrl
    );
    // Load logo image - handle data URLs properly
    let logoImg;
    if (logoImageUrl.startsWith('data:')) {
      try {
        // Extract base64 data from data URL
        const commaIndex = logoImageUrl.indexOf(',');
        if (commaIndex === -1) {
          throw new Error('Invalid data URL format');
        }
        const base64Data = logoImageUrl.substring(commaIndex + 1);

        // Validate base64 data
        if (!base64Data || base64Data.length === 0) {
          throw new Error('Empty base64 data in data URL');
        }

        // Convert to buffer with error handling
        const buffer = Buffer.from(base64Data, 'base64');
        console.log('Created buffer from base64 data, size:', buffer.length, 'bytes');

        // Load image from buffer
        logoImg = await loadImage(buffer);
        console.log('Successfully loaded logo from buffer');
      } catch (error) {
        console.error('Failed to process data URL:', error);
        // Create fallback transparent image if data URL processing fails
        const fallbackCanvas = createCanvas(100, 100);
        const fallbackCtx = fallbackCanvas.getContext('2d');
        fallbackCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        fallbackCtx.fillRect(0, 0, 100, 100);
        fallbackCtx.fillStyle = 'black';
        fallbackCtx.font = '12px Arial';
        fallbackCtx.fillText('Logo', 35, 55);

        const fallbackBuffer = fallbackCanvas.toBuffer('image/png');
        logoImg = await loadImage(fallbackBuffer);
        console.log('Using fallback logo image');
      }
    } else {
      // Handle regular URLs
      logoImg = await loadImage(logoImageUrl);
    }
    console.log('Logo image loaded successfully, dimensions:', logoImg.width, 'x', logoImg.height);

    // Calculate logo placement with proper scaling to fit within constraints
    const maxLogoWidth = Math.min(logoPlacement.width, canvasWidth * 0.4); // Don't exceed 40% of canvas width
    const maxLogoHeight = Math.min(logoPlacement.height, canvasHeight * 0.4); // Don't exceed 40% of canvas height

    // Maintain aspect ratio while fitting within max dimensions
    const logoAspectRatio = logoImg.width / logoImg.height;
    let finalLogoWidth = maxLogoWidth;
    let finalLogoHeight = maxLogoHeight;

    if (finalLogoWidth / finalLogoHeight > logoAspectRatio) {
      // Width is too wide, constrain by height
      finalLogoWidth = finalLogoHeight * logoAspectRatio;
    } else {
      // Height is too tall, constrain by width
      finalLogoHeight = finalLogoWidth / logoAspectRatio;
    }

    // Ensure logo is positioned within canvas bounds
    const logoX = Math.max(0, Math.min(logoPlacement.x, canvasWidth - finalLogoWidth));
    const logoY = Math.max(0, Math.min(logoPlacement.y, canvasHeight - finalLogoHeight));

    console.log('Drawing logo at calculated position:', {
      originalPlacement: logoPlacement,
      finalPosition: { x: logoX, y: logoY, width: finalLogoWidth, height: finalLogoHeight },
      logoOriginalSize: { width: logoImg.width, height: logoImg.height },
      canvasSize: { width: canvasWidth, height: canvasHeight },
    });

    // Draw logo overlay on product image
    ctx.drawImage(logoImg, logoX, logoY, finalLogoWidth, finalLogoHeight);

    // Convert to data URL
    console.log('Converting canvas to data URL...');
    const dataUrl = canvas.toDataURL('image/png');
    console.log('Successfully generated combined image, data URL length:', dataUrl.length);
    return dataUrl;
  } catch (error) {
    console.error('Error combining images:', error);
    throw new Error(
      `Failed to combine images: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get image dimensions server-side
 */
export async function getImageDimensions(
  imageUrl: string
): Promise<{ width: number; height: number }> {
  try {
    const img = await loadImage(imageUrl);
    return {
      width: img.width,
      height: img.height,
    };
  } catch (error) {
    console.error('Error loading image dimensions:', error);
    throw new Error(
      `Failed to get image dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
