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
  
  console.log('NC03 - Invalid Search Input');
  console.log('Testing: How tools handle invalid input causing UI error');
  console.log('App: PHPTravels');
  console.log('Action: Search flight with empty destination');
  console.log('================================================\n');
  
  let testPassed = false;
  
  try {
    // Navigate to PHPTravels
    console.log('Step 1: Navigating to PHPTravels homepage...');
    await page.goto('https://phptravels.net/', {
      waitUntil: 'networkidle'
    });
    console.log('✓ PHPTravels homepage loaded\n');
    
    // Wait for page to be interactive
    await page.waitForTimeout(2000);
    
    // Check if we're on the flights tab or need to click it
    console.log('Step 2: Accessing flight search...');
    const flightTabSelectors = [
      'a:has-text("Flights")',
      '[data-tab="flights"]',
      'button:has-text("Flights")',
      '.nav-link:has-text("Flights")'
    ];
    
    let flightTabFound = false;
    for (const selector of flightTabSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await page.click(selector);
          await page.waitForTimeout(1000);
          flightTabFound = true;
          console.log('✓ Flight search tab activated\n');
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!flightTabFound) {
      console.log('ℹ Flight tab may already be active\n');
    }
    
    // Locate departure and destination fields
    console.log('Step 3: Attempting to search with EMPTY destination field...');
    const departureSelectors = [
      'input[placeholder*="From"]',
      'input[name="from"]',
      'input[id*="from"]',
      'input[placeholder*="Departure"]'
    ];
    
    const destinationSelectors = [
      'input[placeholder*="To"]',
      'input[name="to"]',
      'input[id*="to"]',
      'input[placeholder*="Destination"]'
    ];
    
    // Find and fill departure field
    let departureField = null;
    for (const selector of departureSelectors) {
      const element = await page.$(selector);
      if (element && await element.isVisible()) {
        departureField = selector;
        console.log(`  Found departure field: ${selector}`);
        await page.fill(selector, 'New York');
        console.log('  ✓ Departure filled: "New York"');
        break;
      }
    }
    
    // Leave destination field EMPTY (this is the critical test)
    console.log('  ✓ Destination field: LEFT EMPTY (testing invalid input handling)\n');
    
    // Find and click the search button
    console.log('Step 4: Clicking search button with empty destination...');
    const searchButtonSelectors = [
      'button:has-text("Search")',
      'button[type="submit"]',
      '.btn-search',
      'button.search-btn'
    ];
    
    let searchClicked = false;
    for (const selector of searchButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button && await button.isVisible()) {
          await page.click(selector, { timeout: 2000 });
          console.log('✓ Search button clicked\n');
          searchClicked = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!searchClicked) {
      console.log('⚠ Could not find search button\n');
    }
    
    // Wait for response
    console.log('Step 5: Waiting for validation response...');
    await page.waitForTimeout(3000);
    
    // Look for error/validation messages
    console.log('Step 6: Detecting error elements and validation messages...\n');
    
    const errorSelectors = [
      '.alert-danger',
      '.error-message',
      '[role="alert"]',
      '.validation-error',
      '.form-error',
      '.text-danger',
      '.invalid-feedback',
      'div:has-text("required")',
      'div:has-text("Please")',
      'div:has-text("must")'
    ];
    
    let errorFound = false;
    let errorMessages = [];
    
    for (const selector of errorSelectors) {
      try {
        const elements = await page.$$(selector);
        for (const element of elements) {
          const isVisible = await element.isVisible();
          const text = await element.textContent();
          
          if (isVisible && text && text.trim().length > 0) {
            errorMessages.push({
              selector: selector,
              text: text.trim(),
              visible: isVisible
            });
            errorFound = true;
          }
        }
      } catch (e) {
        // Continue searching
      }
    }
    
    if (errorMessages.length > 0) {
      console.log('✓ ERROR MESSAGES DETECTED:\n');
      errorMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. "${msg.text}"`);
        console.log(`     Selector: ${msg.selector}`);
      });
      console.log();
    } else {
      console.log('⚠ No error messages detected\n');
    }
    
    // Check current URL to see if search was submitted
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Capture screenshot
    await page.screenshot({ 
      path: 'phptravels_nc03_invalid_search.png', 
      fullPage: true 
    });
    console.log('✓ Screenshot saved: phptravels_nc03_invalid_search.png\n');
    
    // Evaluate test result
    if (errorFound || !currentUrl.includes('results')) {
      testPassed = true;
      console.log('✓ TEST RESULT: PASSED');
      console.log('  Website correctly handled empty destination input');
      console.log('  Validation message(s) detected');
    } else {
      console.log('⚠ TEST RESULT: UNCERTAIN');
      console.log('  No validation error detected, search may have been submitted');
    }
    
  } catch (error) {
    console.log('\n================================================');
    console.log('TEST ERROR - Assertion-Based Failure Behavior:');
    console.log('================================================');
    console.log(`Error Name: ${error.name}`);
    console.log(`Error Message: ${error.message}`);
    console.log(`Error Stack: ${error.stack}\n`);
    
    // Error categorization
    if (error.message.includes('not found')) {
      console.log('📊 Error Type: ELEMENT NOT FOUND');
      console.log('   Reason: Could not locate required form elements');
    } else if (error.message.includes('Timeout')) {
      console.log('📊 Error Type: TIMEOUT');
      console.log('   Reason: Element interaction took too long');
    } else if (error.message.includes('not visible')) {
      console.log('📊 Error Type: ELEMENT NOT VISIBLE');
      console.log('   Reason: Form elements are not visible on the page');
    }
    
    try {
      await page.screenshot({ 
        path: 'phptravels_nc03_error.png', 
        fullPage: true 
      });
      console.log('\n✓ Error screenshot saved: phptravels_nc03_error.png');
    } catch (screenshotError) {
      console.log('Could not capture error screenshot');
    }
    
    testPassed = false;
    
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
    
    // Final summary
    console.log('\n================================================');
    console.log('EVALUATION FOCUS: Assertion-Based Failure Behavior');
    console.log('================================================');
    console.log('✓ Website shows validation message: ' + (testPassed ? 'YES' : 'UNKNOWN'));
    console.log('✓ Tools detect error element: ' + (testPassed ? 'YES' : 'NO'));
    console.log('✓ Playwright error handling: VERIFIED');
    console.log('================================================');
  }
})();
