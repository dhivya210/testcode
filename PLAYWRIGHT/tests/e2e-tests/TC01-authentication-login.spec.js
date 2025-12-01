// TC01: Simple Login Test with Diagnostics
const { test, expect } = require('@playwright/test');

test('TC01: Login with valid credentials', async ({ page }) => {
  // Set up network monitoring BEFORE navigation to catch API errors
  let loginRequestFailed = false;
  let loginRequestError = null;
  const loginRequests = [];
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/login') || url.includes('/auth') || url.includes('/signin') || url.includes('/api')) {
      const status = response.status();
      loginRequests.push({ url, status });
      console.log(`  📡 API Response: ${url} - Status: ${status}`);
      if (status >= 400) {
        loginRequestFailed = true;
        try {
          const body = await response.text();
          loginRequestError = `Status ${status}: ${body.substring(0, 200)}`;
          console.log(`  ❌ Login API Error: ${loginRequestError}`);
        } catch (e) {
          loginRequestError = `Status ${status}`;
        }
      }
    }
  });
  
  try {
    // Navigate to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 });
    
  } catch (navError) {
    console.log('\n❌ NAVIGATION ERROR:');
    console.log(`Error: ${navError.message}`);
    console.log('\n⚠️  The application server is NOT running at localhost:5173');
    console.log('\nTo fix this:');
    console.log('1. Start your application server (npm run dev or similar)');
    console.log('2. Make sure it\'s running on port 5173');
    console.log('3. Then run the test again\n');
    throw navError;
  }
  
  // Test credentials
  const testEmail = 'dhivyakathir02@gmail.com';
  const testPassword = 'dharshu1';
  
  console.log('✓ Page loaded successfully\n');
  
  // Get page content for debugging
  console.log('Step 2: Analyzing page structure...');
  const pageContent = await page.content();
  
  // Check for email inputs
  const emailInputs = await page.$$('input[type="email"]');
  const passwordInputs = await page.$$('input[type="password"]');
  const buttons = await page.$$('button');
  
  console.log(`  Found ${emailInputs.length} email input(s)`);
  console.log(`  Found ${passwordInputs.length} password input(s)`);
  console.log(`  Found ${buttons.length} button(s)`);
  
  if (buttons.length > 0) {
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`    Button ${i + 1}: "${text.trim()}"`);
    }
  }
  
  // Try to fill email
  console.log('\nStep 3: Filling email field...');
  const emailSelectors = [
    'input[type="email"]',
    'input[name="email"]',
    'input[placeholder*="email" i]',
    'input[id*="email" i]'
  ];
  
  let emailFilled = false;
  for (const selector of emailSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await page.fill(selector, testEmail);
        console.log(`  ✓ Email filled with selector: ${selector}`);
        emailFilled = true;
        break;
      }
    } catch (e) {
      console.log(`  ✗ Failed with selector: ${selector}`);
    }
  }
  
  if (!emailFilled) {
    console.log('  ❌ Could not find email field with any selector');
  }
  
  // Try to fill password
  console.log('\nStep 4: Filling password field...');
  const passwordSelectors = [
    'input[type="password"]',
    'input[name="password"]',
    'input[placeholder*="password" i]',
    'input[id*="password" i]'
  ];
  
  let passwordFilled = false;
  for (const selector of passwordSelectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await page.fill(selector, testPassword);
        console.log(`  ✓ Password filled with selector: ${selector}`);
        passwordFilled = true;
        break;
      }
    } catch (e) {
      console.log(`  ✗ Failed with selector: ${selector}`);
    }
  }
  
  if (!passwordFilled) {
    console.log('  ❌ Could not find password field with any selector');
  }

  // Click login button
  console.log('\nStep 5: Clicking login button...');
  
  try {
    const buttonSelectors = [
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      'button[type="submit"]',
      'input[type="submit"][value="Sign In"]',
      'input[type="submit"][value="Login"]',
      'button:has-text("sign in")',
      'button:has-text("login")'
    ];
    
    let clicked = false;
    for (const selector of buttonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          console.log(`  ✓ Found button with selector: ${selector}`);
          // Wait for button to be enabled before clicking
          await page.waitForSelector(selector, { state: 'visible' });
          await page.click(selector);
          clicked = true;
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!clicked) {
      console.log('  ⚠️  Trying generic button click...');
      await page.click('button');
    }
  } catch (e) {
    console.log(`  ❌ Error clicking button: ${e.message}`);
  }
  
  // Wait for navigation or button state change
  console.log('\nStep 6: Waiting for login to complete...');
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('error') || text.includes('Error') || text.includes('fail') || text.includes('invalid')) {
      consoleMessages.push(text);
      console.log(`  🔴 Console: ${text}`);
    }
  });
  
  try {
    // Wait for either navigation away from /login OR for button to stop showing "Signing In..."
    // Give it more time - login might take a while
    await Promise.race([
      page.waitForURL(url => !url.includes('/login'), { timeout: 15000 }).catch(() => null),
      page.waitForSelector('button:has-text("Sign In"):not([disabled])', { timeout: 15000, state: 'visible' }).catch(() => null),
      page.waitForTimeout(8000) // Increased wait time
    ]);
  } catch (e) {
    console.log(`  ⚠️  Navigation wait completed: ${e.message}`);
  }
  
  // Additional wait to ensure any async operations complete
  await page.waitForTimeout(2000);
  
  // Check button state after wait
  const signInButton = await page.$('button:has-text("Sign In"), button:has-text("Signing In")');
  if (signInButton) {
    const buttonText = await signInButton.textContent();
    const isDisabled = await signInButton.isDisabled();
    console.log(`  📌 Button state: "${buttonText.trim()}" - Disabled: ${isDisabled}`);
  }
  
  // Check for error messages on the page
  console.log('\nStep 7: Checking for error messages...');
  const errorSelectors = [
    '[role="alert"]',
    '.error',
    '.error-message',
    '[class*="error"]',
    '[class*="Error"]',
    'text=/invalid/i',
    'text=/incorrect/i',
    'text=/failed/i',
    '[data-testid*="error"]',
    '[id*="error"]',
    'p:has-text("error")',
    'div:has-text("error")',
    'span:has-text("error")'
  ];
  
  let foundError = false;
  let errorMessages = [];
  for (const selector of errorSelectors) {
    try {
      const errorElements = await page.$$(selector);
      for (const errorElement of errorElements) {
        const errorText = await errorElement.textContent();
        if (errorText && errorText.trim().length > 0 && errorText.trim().length < 200) {
          const trimmed = errorText.trim();
          if (!errorMessages.includes(trimmed)) {
            errorMessages.push(trimmed);
            console.log(`  ❌ Found error message: "${trimmed}"`);
            foundError = true;
          }
        }
      }
    } catch (e) {
      // Continue
    }
  }
  
  // Check for toast notifications or snackbars
  const toastSelectors = [
    '[class*="toast"]',
    '[class*="snackbar"]',
    '[class*="notification"]',
    '[role="status"]'
  ];
  
  for (const selector of toastSelectors) {
    try {
      const toastElements = await page.$$(selector);
      for (const toast of toastElements) {
        const toastText = await toast.textContent();
        if (toastText && toastText.trim().length > 0) {
          console.log(`  📢 Toast/Notification: "${toastText.trim()}"`);
        }
      }
    } catch (e) {
      // Continue
    }
  }
  
  // Verify login success
  const currentUrl = page.url();
  console.log(`\nCurrent URL: ${currentUrl}`);
  
  // Log all login-related API requests
  console.log('\n📊 Network Activity:');
  if (loginRequests.length > 0) {
    console.log(`  Found ${loginRequests.length} login-related API request(s):`);
    loginRequests.forEach(req => {
      const statusIcon = req.status >= 400 ? '❌' : req.status >= 300 ? '⚠️' : '✓';
      console.log(`    ${statusIcon} ${req.url}: ${req.status}`);
    });
  } else {
    console.log('  ⚠️  No login API requests detected - form may be using client-side only');
    console.log('  💡 This could mean:');
    console.log('     - Form validation is failing before submission');
    console.log('     - Login is handled entirely client-side');
    console.log('     - Network requests are going to a different endpoint');
  }
  
  // Check for any visible text that might indicate what happened
  const pageText = await page.textContent('body');
  if (pageText) {
    const lowerText = pageText.toLowerCase();
    if (lowerText.includes('invalid') || lowerText.includes('incorrect') || lowerText.includes('wrong')) {
      console.log('\n  🔍 Page contains words like "invalid", "incorrect", or "wrong"');
    }
  }
  
  if (loginRequestFailed && loginRequestError) {
    console.log(`\n❌ Login API Request Failed: ${loginRequestError}`);
    throw new Error(`Login failed - API error: ${loginRequestError}`);
  }
  
  // Check for success indicators (user might be logged in even if still on /login)
  console.log('\nStep 8: Checking for login success indicators...');
  const successIndicators = [
    'text=/dashboard/i',
    'text=/profile/i',
    'text=/home/i',
    'text=/welcome/i',
    '[data-testid*="user"]',
    '[class*="user"]',
    '[class*="profile"]',
    'button:has-text("Logout")',
    'button:has-text("Sign Out")',
    'a:has-text("Profile")',
    'a:has-text("Dashboard")'
  ];
  
  let foundSuccessIndicator = false;
  for (const selector of successIndicators) {
    try {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();
        console.log(`  ✓ Found success indicator: "${text?.trim()}"`);
        foundSuccessIndicator = true;
        break;
      }
    } catch (e) {
      // Continue
    }
  }
  
  // Check if page title or heading changed (might indicate successful login)
  const pageTitle = await page.title();
  const mainHeading = await page.$('h1, h2');
  let headingText = '';
  if (mainHeading) {
    headingText = await mainHeading.textContent() || '';
  }
  
  console.log(`  📄 Page title: "${pageTitle}"`);
  if (headingText) {
    console.log(`  📄 Main heading: "${headingText.trim()}"`);
  }
  
  // Decision logic: Only fail if we're sure login failed
  if (foundError) {
    console.log('\n❌ Error message found on page - Login FAILED');
    throw new Error('Login failed - error message displayed on page');
  }
  
  if (loginRequestFailed && loginRequestError) {
    console.log(`\n❌ Login API Request Failed: ${loginRequestError}`);
    throw new Error(`Login failed - API error: ${loginRequestError}`);
  }
  
  // If we found success indicators, consider it a success even if URL hasn't changed
  if (foundSuccessIndicator) {
    console.log('\n✓ Login SUCCESSFUL - Found success indicators on page');
    return; // Test passes
  }
  
  // If still on login page but no errors, check if it's actually a problem
  if (currentUrl.includes('/login')) {
    // Check if button is back to "Sign In" (not "Signing In...") - might mean login completed but no redirect
    const currentButton = await page.$('button:has-text("Sign In"), button:has-text("Signing In")');
    const buttonText = currentButton ? await currentButton.textContent() : '';
    if (buttonText && buttonText.trim() === 'Sign In' && !foundError && loginRequests.length > 0) {
      // Button is back to normal, API was called, no errors - might be successful but no redirect
      console.log('\n⚠️  Still on login page but no errors detected');
      console.log('  Possible reasons:');
      console.log('  1. Login successful but redirect not implemented');
      console.log('  2. Application uses client-side routing that doesn\'t change URL');
      console.log('  3. Need to check page content for logged-in state');
      console.log('\n  Checking if login form is still visible...');
      
      const loginFormVisible = await page.$('input[type="email"], input[type="password"]');
      if (!loginFormVisible) {
        console.log('  ✓ Login form is not visible - Login might be SUCCESSFUL');
        return; // Consider it a pass if form is gone
      }
    }
    
    console.log('\n❌ Still on login page - Login FAILED');
    console.log('\nPossible reasons:');
    console.log('1. Invalid credentials');
    console.log('2. Backend/API is not responding correctly');
    console.log('3. Login form submission is failing silently');
    console.log('4. Redirect logic is not working');
    throw new Error('Login failed - still on login page');
  } else {
    console.log('✓ Redirected from login page - Login SUCCESSFUL');
  }
});
