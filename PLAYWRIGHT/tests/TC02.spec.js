const { chromium } = require('playwright');
const fs = require('fs');

/**
 * Return the first visible element among multiple selectors
 */
async function firstVisible(page, selectors, timeout = 10000) {
  for (const selector of selectors) {
    try {
      const element = await page.locator(selector).first();
      await element.waitFor({ state: 'visible', timeout });
      return element;
    } catch (error) {
      continue;
    }
  }
  return null;
}

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
    // Open ParaBank login page (TESTAR domain)
    await page.goto('https://para.testar.org/parabank/index.htm');
    
    // Enter invalid credentials
    await page.fill('input[name="username"]', 'wronguser');
    await page.fill('input[name="password"]', 'wrongpass');
    
    // Click Log In
    await page.click('input.button[value="Log In"]');
    
    // Verify error message (robust selectors + waits)
    const errorSelectors = [
      '#rightPanel .error',
      '//div[@id="rightPanel"]//p[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"), "could not be verified")]',
      '//div[@id="rightPanel"]//p[contains(., "The username and password could not be verified")]',
      '//div[@id="rightPanel"]//*[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"), "invalid")]',
      '//div[@id="rightPanel"]//p[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"), "error")]'
    ];
    
    const errorEl = await firstVisible(page, errorSelectors, 12000);
    
    // Take screenshot
    await page.screenshot({ path: 'parabank_invalid_login.png', fullPage: true });
    
    if (errorEl) {
      const text = (await errorEl.textContent()).trim();
      console.log(`Test Passed: Error message displayed → '${text}'`);
    } else {
      // Helpful diagnostics
      console.log('Test Failed: Could not locate the error message element.');
      console.log('Current URL:', page.url());
      
      // Save page source for quick inspection
      const pageSource = await page.content();
      fs.writeFileSync('parabank_invalid_login_source.html', pageSource, 'utf-8');
    }
    
  } catch (error) {
    console.error('Test Error:', error.message);
    await page.screenshot({ path: 'parabank_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();