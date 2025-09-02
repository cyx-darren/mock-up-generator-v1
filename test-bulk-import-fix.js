// Test script to verify bulk import fix
const testProductWithEmptyImages = {
  products: [
    {
      name: "Test Product with No Images",
      description: "A test product with empty image URLs to verify base_image_url fallback",
      sku: "TEST-FALLBACK-001",
      category: "office",
      price: 25.99,
      status: "active",
      tags: "test;bulk-import;fallback",
      thumbnail_url: "",
      primary_image_url: "",
      additional_images: ""
    }
  ]
};

async function testBulkImport() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/products/bulk-import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, we'd need to include authentication cookies
      },
      body: JSON.stringify(testProductWithEmptyImages)
    });

    const result = await response.json();
    console.log('Bulk import test result:', result);
    
    if (result.success && result.imported > 0) {
      console.log('✅ SUCCESS: Product with empty image URLs imported successfully!');
      console.log(`Imported ${result.imported} products, failed ${result.failed}`);
    } else {
      console.log('❌ FAILED: Product import failed');
      console.log('Errors:', result.errors);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
console.log('Testing bulk import with empty image URLs...');
testBulkImport();