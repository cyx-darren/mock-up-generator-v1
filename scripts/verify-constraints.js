async function verifyConstraints() {
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

    console.log(`\n=== CONSTRAINT VERIFICATION FOR ${products.length} PRODUCTS ===`);

    let horizontalCount = 0;
    let verticalCount = 0;
    let allOverCount = 0;

    console.log('\nProduct Constraint Status:');
    products.forEach((product, index) => {
      const horizontal = product.horizontal_enabled ? '✓' : '✗';
      const vertical = product.vertical_enabled ? '✓' : '✗';
      const allOver = product.all_over_enabled ? '✓' : '✗';

      if (product.horizontal_enabled) horizontalCount++;
      if (product.vertical_enabled) verticalCount++;
      if (product.all_over_enabled) allOverCount++;

      console.log(
        `${String(index + 1).padStart(2)}. ${product.name.padEnd(25)} | H:${horizontal} V:${vertical} A:${allOver}`
      );
    });

    console.log(`\n=== SUMMARY ===`);
    console.log(`Horizontal enabled: ${horizontalCount}/${products.length} products`);
    console.log(`Vertical enabled:   ${verticalCount}/${products.length} products`);
    console.log(`All-Over enabled:   ${allOverCount}/${products.length} products`);

    // Check if all products have at least 2 constraint options
    let productsWithAtLeast2Options = 0;
    products.forEach((product) => {
      const optionCount =
        (product.horizontal_enabled ? 1 : 0) +
        (product.vertical_enabled ? 1 : 0) +
        (product.all_over_enabled ? 1 : 0);
      if (optionCount >= 2) {
        productsWithAtLeast2Options++;
      }
    });

    console.log(`\n=== TASK 3.1.2 VERIFICATION ===`);
    console.log(
      `Products with ≥2 constraint options: ${productsWithAtLeast2Options}/${products.length}`
    );

    if (productsWithAtLeast2Options === products.length) {
      console.log(`✅ SUCCESS: All products have at least 2 constraint options!`);
      console.log(
        `✅ Task 3.1.2 verification requirement met: "Each product has at least 2 constraint options"`
      );
    } else {
      console.log(
        `❌ INCOMPLETE: ${products.length - productsWithAtLeast2Options} products need more constraint options`
      );
    }
  } catch (error) {
    console.error('Constraint verification failed:', error.message);
  }
}

verifyConstraints();
