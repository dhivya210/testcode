const { chromium } = require('playwright');

(async () => {
  // Launch browser with maximized window
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({
    viewport: null // This allows the maximized window to work properly
  });
  
  const page = await context.newPage();
  
  console.log('NC01 - Login With Missing Username Field');
  console.log('Testing: How Playwright handles "element not found" scenarios');
  console.log('================================================\n');
  
  let testPassed = false;
  
  try {
    // Navigate to the login page
    console.log('Step 1: Navigating to OrangeHRM login page...');
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login', {
      waitUntil: 'networkidle'
    });
    console.log('✓ Login page loaded successfully\n');
    
    // INTENTIONALLY TRY TO LOCATE A NON-EXISTENT USERNAME FIELD
    console.log('Step 2: Attempting to locate and fill WRONG username field selector...');
    const wrongUsernameSelector = 'input[name="nonexistent_username_field"]';
    
    try {
      // This WILL FAIL - testing element not found
      console.log(`  Trying to fill: "${wrongUsernameSelector}"`);
      await page.fill(wrongUsernameSelector, 'admin', { timeout: 2000 });
      console.log('✓ Username field filled (should not reach here)');
    } catch (elementError) {
      console.log('\n✗ ELEMENT NOT FOUND ERROR (Expected):');
      console.log(`  Error: ${elementError.message}`);
      console.log('  This demonstrates Playwright\'s error handling\n');
      throw elementError; // Re-throw to fail the test
    }
    
    // Fill only the password field
    console.log('Step 3: Filling password field...');
    const passwordFieldSelector = 'input[name="password"]';
    await page.fill(passwordFieldSelector, 'admin123');
    console.log('✓ Password field filled successfully\n');
    
    // Click the Login button
    console.log('Step 4: Clicking Login button...');
    await page.click('button[type="submit"]');
    console.log('✓ Login button clicked\n');
    
    // Wait to see what happens
    console.log('Step 5: Waiting for response...');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Capture screenshot
    await page.screenshot({ 
      path: 'playwright_nc01_missing_username.png', 
      fullPage: true 
    });
    console.log('✓ Screenshot saved: playwright_nc01_missing_username.png');
    
    testPassed = true;
    
  } catch (error) {
    console.log('\n================================================');
    console.log('TEST FAILED - Error Details:');
    console.log('================================================');
    console.log(`Error Name: ${error.name}`);
    console.log(`Error Message: ${error.message}`);
    console.log(`Error Stack: ${error.stack}`);
    
    // Categorize the error
    if (error.message.includes('Timeout')) {
      console.log('\n📊 Error Type: TIMEOUT ERROR');
      console.log('   Reason: Element was not found within timeout period');
    } else if (error.message.includes('not found')) {
      console.log('\n📊 Error Type: ELEMENT NOT FOUND');
      console.log('   Reason: Selector did not match any elements');
    } else if (error.message.includes('Target page, context or browser has been closed')) {
      console.log('\n📊 Error Type: BROWSER CLOSED');
    }
    
    try {
      await page.screenshot({ 
        path: 'playwright_nc01_error.png', 
        fullPage: true 
      });
      console.log('\n✓ Error screenshot saved: playwright_nc01_error.png');
    } catch (screenshotError) {
      console.log('Could not take screenshot');
    }
    
    testPassed = false;
    
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
    
    // Final result
    console.log('\n================================================');
    if (!testPassed) {
      console.log('✗ TEST RESULT: FAILED (As Expected)');
      console.log('  Successfully demonstrated "element not found" handling');
    } else {
      console.log('✓ TEST RESULT: PASSED');
    }
    console.log('================================================');
  }
})();
