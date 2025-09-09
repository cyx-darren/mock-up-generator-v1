/**
 * Server-side image processing utilities using Jimp
 */

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
    // Import Jimp dynamically to avoid any potential SSR issues
    const Jimp = (await import('jimp')).default;
    
    console.log('Loading product image from:', productImageUrl);
    // Load product image
    const productImg = await Jimp.read(productImageUrl);
    console.log(
      'Product image loaded successfully, dimensions:',
      productImg.getWidth(),
      'x',
      productImg.getHeight()
    );

    // Use original product image dimensions if not specified
    const canvasWidth = outputWidth || productImg.getWidth();
    const canvasHeight = outputHeight || productImg.getHeight();

    // Resize product image if needed
    if (outputWidth || outputHeight) {
      productImg.resize(canvasWidth, canvasHeight);
    }

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

        // Load image from buffer using Jimp
        logoImg = await Jimp.read(buffer);
        console.log('Successfully loaded logo from buffer');
      } catch (error) {
        console.error('Failed to process data URL:', error);
        // Create fallback logo image if data URL processing fails
        logoImg = new Jimp(100, 100, 0x00000080); // Semi-transparent black
        logoImg.print(await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE), 10, 35, 'Logo');
        console.log('Using fallback logo image');
      }
    } else {
      // Handle regular URLs
      logoImg = await Jimp.read(logoImageUrl);
    }
    console.log('Logo image loaded successfully, dimensions:', logoImg.getWidth(), 'x', logoImg.getHeight());

    // Calculate logo placement with proper scaling to fit within constraints
    const maxLogoWidth = Math.min(logoPlacement.width, canvasWidth * 0.4); // Don't exceed 40% of canvas width
    const maxLogoHeight = Math.min(logoPlacement.height, canvasHeight * 0.4); // Don't exceed 40% of canvas height

    // Maintain aspect ratio while fitting within max dimensions
    const logoAspectRatio = logoImg.getWidth() / logoImg.getHeight();
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
      logoOriginalSize: { width: logoImg.getWidth(), height: logoImg.getHeight() },
      canvasSize: { width: canvasWidth, height: canvasHeight },
    });

    // Resize logo to fit calculated dimensions
    logoImg.resize(finalLogoWidth, finalLogoHeight);

    // Composite logo onto product image
    productImg.composite(logoImg, logoX, logoY);

    // Convert to data URL (base64)
    console.log('Converting image to data URL...');
    const buffer = await productImg.getBufferAsync(Jimp.MIME_PNG);
    const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
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
    // Import Jimp dynamically
    const Jimp = (await import('jimp')).default;
    
    const img = await Jimp.read(imageUrl);
    return {
      width: img.getWidth(),
      height: img.getHeight(),
    };
  } catch (error) {
    console.error('Error loading image dimensions:', error);
    throw new Error(
      `Failed to get image dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
