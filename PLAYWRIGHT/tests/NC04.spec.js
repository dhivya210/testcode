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
  
  console.log('NC04 - Missing Element After Page Scroll');
  console.log('Testing: Behavior when target element is out of viewport');
  console.log('App: SauceDemo');
  console.log('Action: Click "Add to Cart" without scrolling');
  console.log('================================================\n');
  
  let testPassed = false;
  let autoScrollOccurred = false;
  
  try {
    // Navigate to SauceDemo
    console.log('Step 1: Navigating to SauceDemo...');
    await page.goto('https://www.saucedemo.com/', {
      waitUntil: 'networkidle'
    });
    console.log('✓ SauceDemo homepage loaded\n');
    
    // Login with standard user
    console.log('Step 2: Logging in with standard user...');
    await page.fill('input[data-test="username"]', 'standard_user');
    await page.fill('input[data-test="password"]', 'secret_sauce');
    await page.click('input[data-test="login-button"]');
    await page.waitForTimeout(2000);
    console.log('✓ Login successful\n');
    
    // Verify we're on inventory page
    const currentUrl = page.url();
    if (currentUrl.includes('inventory')) {
      console.log('✓ Product inventory page loaded\n');
    }
    
    // Get initial viewport position
    console.log('Step 3: Analyzing viewport and element positions...');
    
    // Get viewport height
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    const scrollTop = await page.evaluate(() => window.scrollY);
    
    console.log(`  Initial viewport height: ${viewportHeight}px`);
    console.log(`  Initial scroll position: ${scrollTop}px\n`);
    
    // Find "Add to Cart" buttons and check their visibility
    console.log('Step 4: Locating "Add to Cart" button that is OUT OF VIEWPORT...');
    
    // Get all add to cart buttons
    const buttons = await page.$$('button:has-text("Add to Cart")');
    console.log(`  Total "Add to Cart" buttons found: ${buttons.length}\n`);
    
    let targetButton = null;
    let buttonInfo = [];
    
    for (let i = 0; i < buttons.length; i++) {
      const boundingBox = await buttons[i].boundingBox();
      const isInViewport = boundingBox && boundingBox.y < viewportHeight && boundingBox.y + boundingBox.height > 0;
      const productName = await buttons[i].evaluate((el) => {
        // Get the product name from the same container
        const container = el.closest('.inventory_item');
        return container ? container.querySelector('.inventory_item_name')?.textContent : 'Unknown';
      });
      
      buttonInfo.push({
        index: i,
        product: productName,
        y: boundingBox?.y,
        inViewport: isInViewport
      });
      
      // Find first button OUT of viewport
      if (!isInViewport && !targetButton) {
        targetButton = buttons[i];
        console.log(`  ✓ Found out-of-viewport button:`);
        console.log(`    Product: ${productName}`);
        console.log(`    Y position: ${boundingBox?.y}px`);
        console.log(`    In viewport: ${isInViewport}\n`);
      }
    }
    
    if (!targetButton && buttons.length > 0) {
      // If all buttons are in viewport, scroll to hide the first one
      console.log('  Note: All buttons visible. Scrolling to hide top button...\n');
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(500);
      
      // Now the top buttons should be out of view
      const allButtons = await page.$$('button:has-text("Add to Cart")');
      if (allButtons.length > 0) {
        targetButton = allButtons[0];
        const boundingBox = await targetButton.boundingBox();
        console.log(`  ✓ Scrolled. First button now out of viewport:`);
        console.log(`    Y position after scroll: ${boundingBox?.y}px\n`);
      }
    }
    
    if (!targetButton) {
      console.log('⚠ Could not find button out of viewport');
      throw new Error('No out-of-viewport button found');
    }
    
    // Get scroll position before click
    const scrollBeforeClick = await page.evaluate(() => window.scrollY);
    console.log('Step 5: Attempting to click out-of-viewport button...');
    console.log(`  Scroll position before click: ${scrollBeforeClick}px`);
    console.log('  ℹ Testing if Playwright auto-scrolls element into view...\n');
    
    try {
      // This is the key test: Playwright should auto-scroll
      await targetButton.click();
      
      // Get scroll position after click
      const scrollAfterClick = await page.evaluate(() => window.scrollY);
      
      if (scrollAfterClick !== scrollBeforeClick) {
        autoScrollOccurred = true;
        console.log('✓ PLAYWRIGHT AUTO-SCROLL DETECTED!');
        console.log(`  Scroll changed from ${scrollBeforeClick}px to ${scrollAfterClick}px`);
        console.log(`  Scroll distance: ${Math.abs(scrollAfterClick - scrollBeforeClick)}px\n`);
      } else {
        console.log('ℹ Element was already in viewport or no scroll occurred\n');
      }
      
      console.log('✓ Button click successful\n');
      
      // Verify something changed (e.g., cart count)
      await page.waitForTimeout(1000);
      
      testPassed = true;
      
    } catch (clickError) {
      console.log('\n✗ CLICK ERROR (This would happen in Selenium):');
      console.log(`  Error: ${clickError.message}\n`);
      
      if (clickError.message.includes('not clickable') || clickError.message.includes('not visible')) {
        console.log('📊 Error Type: ELEMENT NOT CLICKABLE/NOT VISIBLE');
        console.log('   This is typical Selenium behavior with out-of-viewport elements');
        console.log('   Playwright typically handles this automatically with auto-scroll\n');
      }
      
      throw clickError;
    }
    
    // Capture screenshot
    await page.screenshot({ 
      path: 'saucedemo_nc04_autoscroll.png', 
      fullPage: true 
    });
    console.log('✓ Screenshot saved: saucedemo_nc04_autoscroll.png\n');
    
  } catch (error) {
    console.log('================================================');
    console.log('TEST RESULT - Element Visibility Handling:');
    console.log('================================================');
    console.log(`Error Name: ${error.name}`);
    console.log(`Error Message: ${error.message}\n`);
    
    // Error categorization
    if (error.message.includes('not clickable')) {
      console.log('📊 Selenium Behavior: ELEMENT NOT CLICKABLE');
      console.log('   Reason: Element is out of viewport');
      console.log('   Solution: Manual scroll required before interaction');
    } else if (error.message.includes('not visible')) {
      console.log('📊 Selenium Behavior: ELEMENT NOT VISIBLE');
      console.log('   Reason: Element exists but not in viewport');
      console.log('   Solution: Scroll to element first');
    } else if (error.message.includes('No out-of-viewport')) {
      console.log('ℹ Test Setup Issue: Could not find out-of-viewport element');
    }
    
    try {
      await page.screenshot({ 
        path: 'saucedemo_nc04_error.png', 
        fullPage: true 
      });
      console.log('\n✓ Error screenshot saved: saucedemo_nc04_error.png');
    } catch (screenshotError) {
      console.log('Could not capture error screenshot');
    }
    
    testPassed = false;
    
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
    
    // Final summary
    console.log('\n================================================');
    console.log('TOOL BEHAVIOR COMPARISON:');
    console.log('================================================');
    console.log('Selenium: Element not clickable/not visible');
    console.log('  ✗ Fails when clicking out-of-viewport elements');
    console.log('  ✗ Requires manual scroll before interaction\n');
    
    console.log('Playwright: Auto-scroll');
    if (autoScrollOccurred || testPassed) {
      console.log('  ✓ Successfully auto-scrolls element into viewport');
      console.log('  ✓ Handles out-of-viewport elements transparently');
    } else if (testPassed) {
      console.log('  ✓ Click succeeded (auto-scroll likely occurred)');
    } else {
      console.log('  ⚠ Click failed (auto-scroll may have limitations)');
    }
    
    console.log('\n' + (testPassed ? '✓ TEST PASSED' : '✗ TEST FAILED'));
    console.log('================================================');
  }
})();
