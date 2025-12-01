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
  
  try {
    // Navigate to the login page
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
    
    // Enter valid credentials
    await page.fill('input[name="username"]', 'Admin');
    await page.fill('input[name="password"]', 'admin123');
    
    // Click the Login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL('**/dashboard/**', { timeout: 5000 });
    
    // Verify successful login
    const currentUrl = page.url();
    
    if (currentUrl.includes('dashboard')) {
      console.log('Test Passed: Login successful and Dashboard page displayed.');
    } else {
      console.log('Test Failed: Login unsuccessful.');
    }
    
    // Capture screenshot
    await page.screenshot({ path: 'playwright_login_success.png', fullPage: true });
    
  } catch (error) {
    console.error('Test Error:', error.message);
    await page.screenshot({ path: 'playwright_login_error.png', fullPage: true });
  } finally {
    // Close the browser
    await browser.close();
  }
})();