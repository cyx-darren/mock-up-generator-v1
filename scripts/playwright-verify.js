const { chromium } = require('playwright');

async function verifyProductsWithPlaywright() {
  console.log('Starting Playwright verification...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Clear all storage first
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('Navigating to admin login...');
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForLoadState('networkidle');

    // If we're redirected to dashboard, that means we're already authenticated somehow
    if (page.url().includes('/admin/dashboard')) {
      console.log('Already authenticated, checking dashboard...');
    } else {
      console.log('Filling login form...');
      await page.fill('input[type="email"]', 'admin@test.com');
      await page.fill('input[type="password"]', 'NewPassword123!');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
    }

    // Should be on dashboard now
    if (!page.url().includes('/admin/dashboard')) {
      throw new Error(`Expected to be on dashboard, but URL is: ${page.url()}`);
    }

    console.log('✓ Successfully reached admin dashboard');

    // Check if we can see the products tab
    const productsTab = page.locator('text="Products"').first();
    if (await productsTab.isVisible()) {
      console.log('✓ Products tab is visible');
      await productsTab.click();
      await page.waitForTimeout(2000); // Wait for products to load

      // Count products in the UI
      const productRows = page.locator('[data-testid="product-row"], .product-item, .product-card');
      const productCount = await productRows.count();

      console.log(`✓ Found ${productCount} products in the UI`);

      if (productCount >= 20) {
        console.log('✓ SUCCESS: 20 or more products are visible in the admin panel');
      } else {
        console.log(`✗ FAILURE: Only ${productCount} products visible, expected 20`);
      }
    } else {
      console.log('✗ Products tab not visible - checking user permissions');
      const errorMessage = await page.textContent('body');
      console.log('Page content:', errorMessage.substring(0, 500));
    }
  } catch (error) {
    console.error('Playwright verification failed:', error.message);

    // Take screenshot for debugging
    await page.screenshot({ path: 'verification-error.png' });
    console.log('Screenshot saved as verification-error.png');
  } finally {
    await browser.close();
  }
}

verifyProductsWithPlaywright();
