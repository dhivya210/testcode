const { chromium } = require('playwright');

// ---- Demo credentials (change role here if you want) ----
const USERNAME = 'teacher';  // or: admin / manager / student
const PASSWORD = 'sandbox24';

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
    // Open MoodleSandbox home → click "Log in"
    await page.goto('https://sandbox.moodledemo.net/');
    await page.click('a[href*="/login/index.php"]');
    
    // Fill username & password (per on-page hint)
    await page.fill('#username', USERNAME);
    await page.fill('#password', PASSWORD);
    
    // Click "Log in"
    await page.click('#loginbtn');
    
    // Verify we're logged in (user menu becomes available)
    const userMenu = page.locator('#user-menu-toggle, button#user-menu-toggle, a#user-menu-toggle');
    await userMenu.waitFor({ state: 'visible', timeout: 15000 });
    console.log('Logged in as:', USERNAME);
    
    // Open user menu → click "Log out"
    await userMenu.click();
    await page.click('a[href*="login/logout.php"], a[href*="action=logout"]');
    
    // Confirm logged-out state - Moodle shows a logout confirmation page
    try {
      // Wait for logout confirmation or the Continue button
      await Promise.race([
        page.waitForURL('**/login/logout.php**', { timeout: 5000 }),
        page.locator('text="You are not logged in"').first().waitFor({ state: 'visible', timeout: 5000 }),
        page.locator('button:has-text("Continue"), a:has-text("Continue")').first().waitFor({ state: 'visible', timeout: 5000 })
      ]);
      console.log('Logout successful on MoodleSandbox. Test Passed');
    } catch (e) {
      // Check if user menu is gone (alternative verification)
      const userMenuGone = await page.locator('#user-menu-toggle').count() === 0;
      if (userMenuGone) {
        console.log('Logout successful on MoodleSandbox. Test Passed');
      } else {
        throw new Error('Could not verify logout');
      }
    }
    
  } catch (error) {
    await page.screenshot({ path: 'moodle_logout_failure.png', fullPage: true });
    console.error('Test Failed:', error.message);
  } finally {
    await browser.close();
  }
})();