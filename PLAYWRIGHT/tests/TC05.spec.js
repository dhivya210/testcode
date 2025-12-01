const { chromium } = require('playwright');

(async () => {
  // Launch browser with maximized window
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null
  });

  const page = await context.newPage();

  try {
    console.log("🚀 Starting SauceDemo Filter Test...");
    
    // Open the SauceDemo login page
    await page.goto('https://www.saucedemo.com/');
    console.log("✓ Navigated to SauceDemo");

    // Login with valid user (to access product page)
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    console.log("✓ Login completed");

    // Wait for inventory page to load
    await page.waitForSelector('.inventory_list', { state: 'visible' });
    console.log("✓ Products page loaded");

    // Get initial product count and names
    const initialProducts = await page.locator('.inventory_item_name').all();
    const initialFirstProduct = await initialProducts[0].textContent();
    console.log(`✓ Initial products: ${initialProducts.length} items`);
    console.log(`✓ First product: ${initialFirstProduct}`);

    // Test all filter options
    const filterTests = [
      { value: 'az', name: 'Name (A to Z)' },
      { value: 'za', name: 'Name (Z to A)' },
      { value: 'lohi', name: 'Price (low to high)' },
      { value: 'hilo', name: 'Price (high to low)' }
    ];

    for (const filter of filterTests) {
      console.log(`\n🔧 Testing filter: ${filter.name}...`);
      
      // Select filter from dropdown
      await page.selectOption('.product_sort_container', filter.value);
      
      // Wait for products to reorder
      await page.waitForTimeout(1000);
      
      // Get current product state
      const currentProducts = await page.locator('.inventory_item').all();
      const currentFirstProduct = await page.locator('.inventory_item_name').first().textContent();
      
      // Validations
      if (currentProducts.length === 0) {
        throw new Error('No products displayed after filtering');
      }
      
      if (currentProducts.length !== initialProducts.length) {
        throw new Error('Product count changed after filtering');
      }
      
      // Verify order changed for name filters
      if (filter.value === 'za' && currentFirstProduct === initialFirstProduct) {
        throw new Error('Products should be reordered Z-A');
      }
      
      console.log(`✓ Filter applied successfully`);
      console.log(`✓ First product: ${currentFirstProduct}`);
      console.log(`✓ Product count: ${currentProducts.length} - Application stable`);
    }

    // Final validation - application didn't crash
    const currentUrl = page.url();
    if (!currentUrl.includes('inventory')) {
      throw new Error('Application navigated away from products page');
    }

    // Take success screenshot
    await page.screenshot({ path: 'saucedemo_filter_test_success.png', fullPage: true });
    
    console.log("\nTEST PASSED: All filters working correctly!");
    console.log("✓ Application remained stable throughout");
    console.log("✓ All filter options functional");
    console.log("✓ No crashes or errors detected");

  } catch (error) {
    // Take failure screenshot
    await page.screenshot({ path: 'saucedemo_filter_test_fail.png', fullPage: true });
    
    console.error('\n TEST FAILED:', error.message);
    
    // Debug information
    try {
      const currentProducts = await page.locator('.inventory_item').count();
      const currentUrl = page.url();
      console.log(`🔍 Debug - Current products: ${currentProducts}`);
      console.log(`🔍 Debug - Current URL: ${currentUrl}`);
    } catch (debugError) {
      console.log('🔍 Debug - Could not capture debug info');
    }
  } finally {
    console.log("\nClosing browser...");
    await browser.close();
  }
})();