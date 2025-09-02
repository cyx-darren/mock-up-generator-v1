async function verifyProducts() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // First, login to get the authentication cookies
    const loginResponse = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'NewPassword123!'
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    // Get cookies from login response
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Fetch products
    const productsResponse = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'GET',
      headers: {
        'Cookie': cookies || '',
      },
    });

    if (!productsResponse.ok) {
      throw new Error(`Products fetch failed: ${productsResponse.status}`);
    }

    const data = await productsResponse.json();
    const products = data.products || [];
    
    console.log(`\n=== PRODUCT VERIFICATION RESULTS ===`);
    console.log(`Total products in system: ${products.length}`);
    console.log(`Target: 20 products\n`);
    
    // Check thumbnails and categorization
    let productsWithThumbnails = 0;
    let categorizedProducts = 0;
    const categories = new Set();
    
    console.log('Product Details:');
    products.forEach((product, index) => {
      const hasThumb = !!product.thumbnail_url;
      const hasCat = !!product.category;
      
      if (hasThumb) productsWithThumbnails++;
      if (hasCat) {
        categorizedProducts++;
        categories.add(product.category);
      }
      
      console.log(`${index + 1}. ${product.name} (${product.sku})`);
      console.log(`   Category: ${product.category || 'NONE'}`);
      console.log(`   Thumbnail: ${hasThumb ? '✓' : '✗'}`);
      console.log(`   Price: $${product.price}`);
      console.log(`   Status: ${product.status}`);
      console.log('');
    });
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`✓ Products uploaded: ${products.length}/20 ${products.length >= 20 ? '(COMPLETE)' : '(INCOMPLETE)'}`);
    console.log(`✓ Products with thumbnails: ${productsWithThumbnails}/${products.length} ${productsWithThumbnails === products.length ? '(ALL)' : '(SOME MISSING)'}`);
    console.log(`✓ Categorized products: ${categorizedProducts}/${products.length} ${categorizedProducts === products.length ? '(ALL)' : '(SOME MISSING)'}`);
    console.log(`✓ Categories used: ${Array.from(categories).join(', ')}`);
    
    // Check if task 3.1.1 requirements are met
    const task311Complete = products.length >= 20 && 
                           productsWithThumbnails === products.length && 
                           categorizedProducts === products.length;
    
    console.log(`\n=== TASK 3.1.1 STATUS ===`);
    console.log(`${task311Complete ? '✓ COMPLETE' : '✗ INCOMPLETE'}: Product Upload Campaign`);
    
    if (!task311Complete) {
      console.log('\nRemaining tasks:');
      if (products.length < 20) {
        console.log(`- Add ${20 - products.length} more products`);
      }
      if (productsWithThumbnails < products.length) {
        console.log(`- Add thumbnails to ${products.length - productsWithThumbnails} products`);
      }
      if (categorizedProducts < products.length) {
        console.log(`- Add categories to ${products.length - categorizedProducts} products`);
      }
    }
    
  } catch (error) {
    console.error('Verification failed:', error.message);
  }
}

verifyProducts();