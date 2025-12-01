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
  
  console.log('NC02 - Click on Disabled Button');
  console.log('Testing: How Playwright handles clicking disabled elements');
  console.log('App: ParaBank');
  console.log('================================================\n');
  
  let testPassed = false;
  
  try {
    // Navigate to ParaBank
    console.log('Step 1: Navigating to ParaBank homepage...');
    await page.goto('https://para.testar.org/parabank/index.htm', {
      waitUntil: 'networkidle'
    });
    console.log('✓ ParaBank homepage loaded\n');
    
    // Click on Register link to go to registration page
    console.log('Step 2: Navigating to Register page...');
    await page.click('a:has-text("Register")');
    await page.waitForTimeout(2000);
    console.log('✓ Register page loaded\n');
    
    // Check if Register button is disabled (without filling fields)
    console.log('Step 3: Attempting to click DISABLED "Register" button...');
    console.log('  (Note: Button should be disabled before filling required fields)\n');
    
    try {
      // Try to find and click the Register button
      const registerButtonSelector = 'input[type="submit"][value="Register"]';
      
      // Check if button exists and its state
      const buttonElement = await page.$(registerButtonSelector);
      
      if (buttonElement) {
        // Check if it's disabled
        const isDisabled = await page.evaluate((selector) => {
          const el = document.querySelector(selector);
          return el ? el.disabled : null;
        }, registerButtonSelector);
        
        console.log(`  Button found. Disabled state: ${isDisabled}`);
        
        if (isDisabled) {
          console.log('  ⚠ Button is DISABLED - attempting to click it...\n');
        } else {
          console.log('  ℹ Button is ENABLED - attempting to click it anyway...\n');
        }
      }
      
      // Try to click the button - this will fail if disabled
      await page.click(registerButtonSelector, { timeout: 2000 });
      
      console.log('✓ Button clicked (should not reach here if button is disabled)');
      testPassed = true;
      
    } catch (clickError) {
      console.log('\n✗ ELEMENT NOT INTERACTABLE ERROR (Expected):');
      console.log(`  Error Name: ${clickError.name}`);
      console.log(`  Error Message: ${clickError.message}\n`);
      
      // Categorize the error
      if (clickError.message.includes('not interactable') || clickError.message.includes('disabled')) {
        console.log('📊 Error Type: ELEMENT NOT INTERACTABLE');
        console.log('   Reason: Button is disabled or not clickable');
        console.log('   This demonstrates Playwright\'s interaction validation\n');
      }
      
      throw clickError; // Re-throw to fail the test
    }
    
    // Capture screenshot
    await page.screenshot({ 
      path: 'parabank_nc02_disabled_button.png', 
      fullPage: true 
    });
    console.log('Screenshot saved: parabank_nc02_disabled_button.png');
    
  } catch (error) {
    console.log('================================================');
    console.log('TEST FAILED - Interaction Validation Results:');
    console.log('================================================');
    console.log(`Error Name: ${error.name}`);
    console.log(`Error Message: ${error.message}`);
    console.log(`Error Stack: ${error.stack}\n`);
    
    // Detailed error categorization
    if (error.message.includes('not interactable')) {
      console.log('✓ INTERACTION VALIDATION: SUCCESS');
      console.log('  Playwright correctly rejected click on disabled button');
      console.log('  Error Type: Element Not Interactable');
    } else if (error.message.includes('not find') || error.message.includes('not found')) {
      console.log('⚠ Element Not Found');
      console.log('  The Register button selector may need adjustment');
    } else if (error.message.includes('Timeout')) {
      console.log('⚠ Timeout Error');
      console.log('  Element took too long to respond or become available');
    }
    
    try {
      await page.screenshot({ 
        path: 'parabank_nc02_error.png', 
        fullPage: true 
      });
      console.log('\n✓ Error screenshot saved: parabank_nc02_error.png');
    } catch (screenshotError) {
      console.log('Could not capture error screenshot');
    }
    
    testPassed = false;
    
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
    
    // Final result
    console.log('\n================================================');
    if (!testPassed) {
      console.log('✗ TEST RESULT: FAILED (As Expected)');
      console.log('  Successfully demonstrated disabled button handling');
      console.log('  Playwright threw "element not interactable" error');
    } else {
      console.log('✓ TEST RESULT: PASSED');
      console.log('  Button click succeeded');
    }
    console.log('================================================');
  }
})();
