async function enableConstraintsForAllProducts() {
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
    
    // Fetch all products
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
    
    console.log(`\n=== ENABLING CONSTRAINTS FOR ${products.length} PRODUCTS ===`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        console.log(`\nProcessing: ${product.name} (${product.sku})`);
        
        // Enable vertical placement
        const verticalPayload = {
          enabled: true,
          min_width: 30,
          min_height: 80,
          max_width: 300,
          max_height: 600,
          default_x: 150,
          default_y: 50,
          guidelines: `For vertical placement on ${product.name}, position your logo in portrait orientation. The logo should be centered within the designated area and maintain appropriate padding from edges.`
        };

        const verticalResponse = await fetch(`${baseUrl}/api/admin/products/${product.id}/constraints`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies || '',
          },
          body: JSON.stringify({
            type: 'vertical',
            ...verticalPayload
          }),
        });

        if (!verticalResponse.ok) {
          console.log(`  ✗ Failed to enable vertical constraint: ${verticalResponse.status}`);
          errorCount++;
          continue;
        }

        // Enable all-over print
        const allOverPayload = {
          enabled: true,
          horizontal_repeats: 3,
          vertical_repeats: 4,
          pattern_spacing: 10,
          min_pattern_width: 20,
          min_pattern_height: 20,
          max_pattern_width: 200,
          max_pattern_height: 200,
          guidelines: `For all-over pattern on ${product.name}, ensure your design is small enough to repeat effectively across the surface. Pattern should be subtle and complement the product's functionality.`
        };

        const allOverResponse = await fetch(`${baseUrl}/api/admin/products/${product.id}/constraints`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies || '',
          },
          body: JSON.stringify({
            type: 'all_over',
            ...allOverPayload
          }),
        });

        if (allOverResponse.ok) {
          console.log(`  ✓ Enabled vertical and all-over constraints`);
          successCount++;
        } else {
          console.log(`  ✗ Failed to enable all-over constraint: ${allOverResponse.status}`);
          errorCount++;
        }

      } catch (error) {
        console.log(`  ✗ Error processing ${product.name}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`✓ Products processed successfully: ${successCount}`);
    console.log(`✗ Products with errors: ${errorCount}`);
    console.log(`\nEach product should now have:`);
    console.log(`- Horizontal placement (enabled by default)`);
    console.log(`- Vertical placement (enabled by script)`);
    console.log(`- All-over print (enabled by script)`);
    
  } catch (error) {
    console.error('Constraint enablement failed:', error.message);
  }
}

enableConstraintsForAllProducts();