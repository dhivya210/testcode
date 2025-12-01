const { chromium } = require('playwright');

// Configuration
const BASE_URL = 'https://www.saucedemo.com';
const USERNAME = 'standard_user';
const PASSWORD = 'secret_sauce';
const PRODUCT_NAME = 'Sauce Labs Backpack';

(async () => {
  // Setup Chrome
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null,
    permissions: ['notifications']
  });

  const page = await context.newPage();

  try {
    console.log('='.repeat(60));
    console.log('SAUCEDEMO ADD TO CART TEST');
    console.log('='.repeat(60));

    // 1. Login
    console.log('\n[1/5] Logging in...');
    await page.goto(BASE_URL);

    await page.fill('#user-name', USERNAME);
    await page.fill('#password', PASSWORD);
    await page.click('#login-button');

    await page.waitForURL('**/inventory.html');
    console.log('      ✓ Login successful');

    // Dismiss any password save popups
    try {
      await page.evaluate(() => document.querySelector('body').click());
      await page.waitForTimeout(500);
    } catch (e) {
      // Continue
    }

    // 2. Find product
    console.log(`\n[2/5] Finding product: '${PRODUCT_NAME}'...`);

    // Wait for inventory to load
    await page.locator('.inventory_list').waitFor({ state: 'visible' });

    // Find product by data-test attribute (more reliable)
    const addToCartButton = page.locator('#add-to-cart-sauce-labs-backpack');
    await addToCartButton.waitFor({ state: 'visible' });
    console.log('      ✓ Found product');

    // Get price before adding to cart
    let productPrice = 'N/A';
    try {
      const priceElement = page.locator(
        "//div[text()='Sauce Labs Backpack']/ancestor::div[@class='inventory_item']//div[@class='inventory_item_price']"
      );
      productPrice = await priceElement.textContent();
      console.log(`      ✓ Price: ${productPrice}`);
    } catch (e) {
      // Continue
    }

    // 3. Add to cart
    console.log('\n[3/5] Adding to cart...');

    // Ensure button is visible and clickable
    await addToCartButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Click the button
    await addToCartButton.click();
    await page.waitForTimeout(1000);
    console.log('      ✓ Clicked add to cart button');

    // Verify button changed to Remove
    try {
      await page.locator('#remove-sauce-labs-backpack').waitFor({ state: 'visible', timeout: 3000 });
      console.log('      ✓ Button changed to "Remove"');
    } catch (e) {
      console.log('      ⚠ Could not verify button change');
    }

    // 4. Verify cart badge
    console.log('\n[4/5] Verifying cart badge...');

    const cartBadge = page.locator('span.shopping_cart_badge');
    await cartBadge.waitFor({ state: 'visible' });
    const cartCount = await cartBadge.textContent();
    console.log(`      ✓ Cart badge shows: ${cartCount}`);

    if (cartCount !== '1') {
      throw new Error(`Expected cart count '1', got '${cartCount}'`);
    }

    // 5. Verify in cart
    console.log('\n[5/5] Opening cart and verifying...');

    // Click cart
    const cartLink = page.locator('a.shopping_cart_link');
    await cartLink.click();

    await page.waitForTimeout(1000);
    await page.waitForURL('**/cart.html');
    console.log('      ✓ Navigated to cart');

    // Verify product in cart
    const cartProduct = page.locator(`//div[@class='inventory_item_name' and text()='${PRODUCT_NAME}']`);
    await cartProduct.waitFor({ state: 'visible' });
    const cartProductText = await cartProduct.textContent();
    console.log(`      ✓ Product found in cart: '${cartProductText}'`);

    // Get cart item and verify details
    const cartItem = page.locator(`//div[@class='inventory_item_name' and text()='${PRODUCT_NAME}']/ancestor::div[@class='cart_item']`);

    const cartPrice = await cartItem.locator('.inventory_item_price').textContent();
    const cartQty = await cartItem.locator('.cart_quantity').textContent();

    console.log(`      ✓ Price in cart: ${cartPrice}`);
    console.log(`      ✓ Quantity: ${cartQty}`);

    if (productPrice !== 'N/A' && cartPrice === productPrice) {
      console.log('      ✓ Price matches inventory');
    }

    // Success screenshot
    await page.screenshot({ path: 'saucedemo_success.png', fullPage: true });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST PASSED');
    console.log('='.repeat(60));
    console.log(`  Product: ${PRODUCT_NAME}`);
    console.log(`  Price: ${cartPrice}`);
    console.log(`  Quantity: ${cartQty}`);
    console.log('  Screenshot: saucedemo_success.png');
    console.log('='.repeat(60));

  } catch (error) {
    // Check if it's an assertion error
    if (error.message.includes('Expected cart count')) {
      await page.screenshot({ path: 'saucedemo_assertion_fail.png', fullPage: true });
      console.log('\n' + '='.repeat(60));
      console.log('❌ ASSERTION FAILED');
      console.log('='.repeat(60));
      console.log(`Error: ${error.message}`);
      console.log('Screenshot: saucedemo_assertion_fail.png');
      console.log('='.repeat(60));
    } else {
      await page.screenshot({ path: 'saucedemo_fail.png', fullPage: true });
      console.log('\n' + '='.repeat(60));
      console.log('❌ TEST FAILED');
      console.log('='.repeat(60));
      console.log(`Error: ${error.message}`);
      console.log(`Current URL: ${page.url()}`);
      console.log('Screenshot: saucedemo_fail.png');
      console.log('='.repeat(60));
      console.error(error.stack);
    }
  } finally {
    console.log('\nTest complete! Closing browser...');
    await page.waitForTimeout(2000);
    await browser.close();
    console.log('Browser closed');
  }
})();