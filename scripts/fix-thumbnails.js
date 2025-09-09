async function fixThumbnails() {
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

    // First, get all products to find the ones without thumbnails
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

    // Find products without thumbnails
    const productsToUpdate = products.filter((p) => !p.thumbnail_url);

    console.log(
      `Found ${productsToUpdate.length} products without thumbnails:`,
      productsToUpdate.map((p) => `${p.name} (${p.sku})`).join(', ')
    );

    // Thumbnail mappings for the specific products we know need updating
    const thumbnailMappings = {
      'TEST-001': {
        thumbnail_url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
        primary_image_url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800',
      },
      'OFF-622067': {
        thumbnail_url: 'https://images.unsplash.com/photo-1587614203976-365c74645e83?w=400',
        primary_image_url: 'https://images.unsplash.com/photo-1587614203976-365c74645e83?w=800',
      },
    };

    console.log('Fixing thumbnails for products...');

    for (const product of productsToUpdate) {
      try {
        const thumbnails = thumbnailMappings[product.sku];
        if (!thumbnails) {
          console.log(`✗ No thumbnail mapping for SKU: ${product.sku}`);
          continue;
        }

        // Create complete update payload with all required fields
        const updateData = {
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          sku: product.sku,
          status: product.status,
          tags: product.tags,
          thumbnail_url: thumbnails.thumbnail_url,
          primary_image_url: thumbnails.primary_image_url,
          additional_images: product.additional_images,
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
          console.log(`✓ Updated thumbnails for: ${product.name} (${product.sku})`);
        } else {
          const errorText = await response.text();
          console.log(`✗ Failed to update ${product.name}: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        console.log(`✗ Error updating ${product.name}: ${error.message}`);
      }
    }

    console.log('\nThumbnail updates complete!');
  } catch (error) {
    console.error('Fix thumbnails failed:', error.message);
  }
}

fixThumbnails();
