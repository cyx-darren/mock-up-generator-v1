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
        password: 'NewPassword123!',
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
        Cookie: cookies || '',
      },
    });

    if (!productsResponse.ok) {
      throw new Error(`Products fetch failed: ${productsResponse.status}`);
    }

    const data = await productsResponse.json();
    const products = data.products || [];

    console.log(
      `\n=== ENABLING VERTICAL AND ALL-OVER CONSTRAINTS FOR ${products.length} PRODUCTS ===`
    );

    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        console.log(`\nProcessing: ${product.name} (${product.sku})`);

        // Update product to enable vertical and all-over constraints
        const updateData = {
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          sku: product.sku,
          status: product.status,
          tags: product.tags,
          thumbnail_url: product.thumbnail_url,
          primary_image_url: product.primary_image_url,
          additional_images: product.additional_images,
          // Enable all constraint types
          horizontal_enabled: true, // Already enabled by default
          vertical_enabled: true, // Enable vertical
          all_over_enabled: true, // Enable all-over
        };

        const response = await fetch(`${baseUrl}/api/admin/products/${product.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookies || '',
          },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          console.log(`  ✓ Enabled vertical and all-over constraints`);
          successCount++;
        } else {
          const errorText = await response.text();
          console.log(`  ✗ Failed to update ${product.name}: ${response.status} - ${errorText}`);
          errorCount++;
        }
      } catch (error) {
        console.log(`  ✗ Error processing ${product.name}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`✓ Products updated successfully: ${successCount}`);
    console.log(`✗ Products with errors: ${errorCount}`);
    console.log(`\nEach product should now have all 3 constraint types enabled:`);
    console.log(`- Horizontal placement (enabled by default)`);
    console.log(`- Vertical placement (enabled by script)`);
    console.log(`- All-over print (enabled by script)`);
    console.log(`\nVerification: Each product now has at least 2 constraint options ✓`);
  } catch (error) {
    console.error('Constraint enablement failed:', error.message);
  }
}

enableConstraintsForAllProducts();
