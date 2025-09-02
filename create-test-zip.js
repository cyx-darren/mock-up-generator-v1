const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

// Create sample image data (1x1 pixel PNG)
const createSamplePNG = (color = 'red') => {
  // Minimal PNG header for a 1x1 pixel image
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // Width: 1, Height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // Color type: RGB
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk header
    0x54, 0x08, 0x99, 0x01, 0x01, 0x03, 0x00, 0xFC, // Image data
    0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 
    0xE2, 0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00, // IEND chunk
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  return pngData;
};

async function createTestZip() {
  const zip = new JSZip();

  // Get existing products to create matching filenames
  console.log('Creating test ZIP file with sample images...');

  // Sample filenames that might match products
  const testFiles = [
    'MUG-001.png',           // Should match Premium Coffee Mug
    'PEN-002.jpg',           // Should match Executive Pen Set  
    'TEST-001.png',          // Should match Test Product with No Images
    'off-622067.png',        // Should match Test Audit Product (partial match)
    'random-image.jpg',      // Should be unmatched
    'another-test.png'       // Should be unmatched
  ];

  // Add sample images to ZIP
  testFiles.forEach((filename, index) => {
    const imageData = createSamplePNG();
    zip.file(filename, imageData);
    console.log(`Added ${filename} to ZIP`);
  });

  // Generate ZIP file
  const zipData = await zip.generateAsync({ type: 'nodebuffer' });
  const zipPath = path.join(__dirname, 'test-images.zip');
  
  fs.writeFileSync(zipPath, zipData);
  console.log(`Test ZIP file created: ${zipPath}`);
  console.log(`ZIP size: ${(zipData.length / 1024).toFixed(2)} KB`);
  
  return zipPath;
}

// Run the script
createTestZip().catch(console.error);