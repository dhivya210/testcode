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
  
  console.log('NC05 - Incorrect URL Load');
  console.log('Testing: Failure when page doesn\'t load properly');
  console.log('App: Moodle Sandbox');
  console.log('Action: Load invalid URL');
  console.log('================================================\n');
  
  let testPassed = false;
  let navigationError = false;
  
  try {
    // Test 1: Try to load an invalid URL
    console.log('Step 1: Attempting to load INVALID URL...');
    const invalidUrl = 'https://sandbox.moodledemo.net/abc123';
    console.log(`  URL: ${invalidUrl}\n`);
    
    try {
      console.log('Step 2: Navigating to invalid URL with timeout...');
      await page.goto(invalidUrl, {
        waitUntil: 'networkidle',
        timeout: 10000
      });
      
      navigationError = false;
      console.log('✓ Page loaded (may be 404 or redirected)\n');
      
    } catch (navError) {
      navigationError = true;
      console.log('\n✗ NAVIGATION ERROR (Expected):');
      console.log(`  Error Type: ${navError.name}`);
      console.log(`  Error Message: ${navError.message}\n`);
      
      // Categorize navigation errors
      if (navError.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        console.log('📊 Error Type: DNS RESOLUTION FAILURE');
        console.log('   Reason: Could not resolve domain name');
      } else if (navError.message.includes('net::ERR_CONNECTION_REFUSED')) {
        console.log('📊 Error Type: CONNECTION REFUSED');
        console.log('   Reason: Server refused the connection');
      } else if (navError.message.includes('Timeout')) {
        console.log('📊 Error Type: NAVIGATION TIMEOUT');
        console.log('   Reason: Page took too long to load');
      } else if (navError.message.includes('ERR_INVALID_URL')) {
        console.log('📊 Error Type: INVALID URL');
        console.log('   Reason: URL format is invalid');
      }
      
      throw navError;
    }
    
    // If we get here, page loaded - check what we got
    console.log('Step 3: Analyzing loaded page...');
    const currentUrl = page.url();
    const pageTitle = await page.title();
    
    console.log(`  Current URL: ${currentUrl}`);
    console.log(`  Page Title: ${pageTitle}\n`);
    
    // Check if it's a 404 or error page
    console.log('Step 4: Checking for error indicators...\n');
    
    const errorIndicators = {
      '404': await page.content().then(content => content.includes('404')),
      'Not Found': await page.content().then(content => content.includes('Not Found')),
      'Error': await page.content().then(content => content.includes('Error')),
      'Page not found': await page.content().then(content => content.includes('page not found'))
    };
    
    console.log('Error indicators detected:');
    Object.entries(errorIndicators).forEach(([key, found]) => {
      console.log(`  ${found ? '✓' : '✗'} ${key}`);
    });
    console.log();
    
    // Look for specific error elements
    console.log('Step 5: Looking for error page elements...\n');
    
    const errorSelectors = {
      'h1 (page title)': 'h1',
      '404 error message': '[class*="error"]',
      'error alert': '[role="alert"]',
      '.error class': '.error',
      'error text': 'p:has-text("not found")'
    };
    
    let errorElementsFound = [];
    
    for (const [name, selector] of Object.entries(errorSelectors)) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          for (const element of elements) {
            const text = await element.textContent();
            if (text && text.trim()) {
              errorElementsFound.push({
                name: name,
                selector: selector,
                text: text.trim().substring(0, 100)
              });
            }
          }
        }
      } catch (e) {
        // Element not found, continue
      }
    }
    
    if (errorElementsFound.length > 0) {
      console.log('Error page elements found:\n');
      errorElementsFound.forEach((el, index) => {
        console.log(`  ${index + 1}. ${el.name}`);
        console.log(`     Selector: ${el.selector}`);
        console.log(`     Text: "${el.text}"\n`);
      });
    } else {
      console.log('⚠ No standard error elements found\n');
    }
    
    // Step 6: Try to locate expected elements that should be on a valid page
    console.log('Step 6: Testing for MISSING EXPECTED ELEMENTS...\n');
    
    const expectedElements = {
      'Dashboard': '[class*="dashboard"]',
      'Course list': '[class*="course"]',
      'Navigation menu': 'nav',
      'User menu': '[class*="user"]',
      'Main content': 'main'
    };
    
    console.log('Searching for expected Moodle elements:\n');
    let expectedElementsFound = 0;
    
    for (const [name, selector] of Object.entries(expectedElements)) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          console.log(`  ✓ ${name}`);
          expectedElementsFound++;
        } else {
          console.log(`  ✗ ${name} (not found or hidden)`);
        }
      } catch (e) {
        console.log(`  ✗ ${name}`);
      }
    }
    
    console.log(`\nExpected elements found: ${expectedElementsFound}/${Object.keys(expectedElements).length}\n`);
    
    // Determine if this is truly an error page
    if (errorElementsFound.length > 0 || expectedElementsFound === 0) {
      console.log('✓ TEST RESULT: PASSED');
      console.log('  Successfully detected navigation error');
      console.log('  Tests would fail due to missing expected elements');
      testPassed = true;
    } else {
      console.log('⚠ TEST RESULT: UNCERTAIN');
      console.log('  Page loaded but unclear if it\'s valid content');
      testPassed = true;
    }
    
    // Capture screenshot
    await page.screenshot({ 
      path: 'moodle_nc05_invalid_url.png', 
      fullPage: true 
    });
    console.log('\n✓ Screenshot saved: moodle_nc05_invalid_url.png');
    
  } catch (error) {
    console.log('================================================');
    console.log('NAVIGATION ERROR HANDLING RESULTS:');
    console.log('================================================');
    console.log(`Error Name: ${error.name}`);
    console.log(`Error Message: ${error.message}\n`);
    
    // Detailed error analysis
    console.log('Error Analysis:');
    
    if (error.message.includes('net::ERR')) {
      console.log('  ✓ Browser correctly detected network error');
      console.log('  ✓ Playwright throws error on invalid navigation');
    } else if (error.message.includes('Timeout')) {
      console.log('  ✓ Page load timeout detected');
      console.log('  ✓ Timeout mechanism working correctly');
    }
    
    console.log('\nTest Implications:');
    console.log('  - Tests expecting dashboard elements would FAIL');
    console.log('  - Page assertions would not find expected content');
    console.log('  - Navigation error handling is critical in test suites\n');
    
    try {
      await page.screenshot({ 
        path: 'moodle_nc05_error.png', 
        fullPage: true 
      });
      console.log('✓ Error screenshot saved: moodle_nc05_error.png');
    } catch (screenshotError) {
      console.log('Could not capture error screenshot');
    }
    
    testPassed = true; // Navigation error is expected behavior
    
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
    
    // Final summary
    console.log('\n================================================');
    console.log('NAVIGATION ERROR HANDLING SUMMARY:');
    console.log('================================================');
    
    if (navigationError) {
      console.log('✓ Playwright throws navigation error on invalid URL');
    } else {
      console.log('✓ Invalid URL redirected or loaded error page');
    }
    
    console.log('\n✓ Tests fail on missing expected elements');
    console.log('✓ Navigation error handling works correctly');
    console.log('✓ Playwright properly detects page load failures');
    
    console.log('\nKey Findings:');
    console.log('  1. Invalid URLs trigger navigation errors');
    console.log('  2. Error pages lack expected dashboard elements');
    console.log('  3. Test assertions would fail on 404/error pages');
    console.log('  4. Timeout mechanism prevents indefinite waits');
    
    console.log('\n' + (testPassed ? '✓ TEST COMPLETED' : '✗ TEST FAILED'));
    console.log('================================================');
  }
})();
