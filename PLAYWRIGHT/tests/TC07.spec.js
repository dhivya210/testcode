const { chromium } = require('playwright');

const BASE_URL = 'https://parabank.parasoft.com/parabank/index.htm';
const USERNAME = 'john';
const PASSWORD = 'demo';
const AMOUNT = '25';

/**
 * Wait until a <select> has at least minCount <option> elements
 */
async function waitForOptions(selectLocator, minCount = 1, timeout = 15000) {
  const endTime = Date.now() + timeout;
  
  while (Date.now() < endTime) {
    const options = await selectLocator.locator('option').all();
    if (options.length >= minCount) {
      return options;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return await selectLocator.locator('option').all();
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
    // 1) Login
    await page.goto(BASE_URL);
    
    await page.fill('input[name="username"]', USERNAME);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('input.button[value="Log In"]');
    
    // Wait for login to complete by checking for the link (not the heading)
    await page.locator('a[href="overview.htm"]').waitFor({ state: 'visible' });

    // 2) Transfer Funds
    await page.click('text="Transfer Funds"');
    await page.locator('//h1[contains(.,"Transfer Funds")]').waitFor({ state: 'visible' });

    // 3) Get dropdowns and ensure they have options
    const fromSelect = page.locator('#fromAccountId');
    const toSelect = page.locator('#toAccountId');
    
    await fromSelect.waitFor({ state: 'visible' });
    await toSelect.waitFor({ state: 'visible' });

    const fromOptions = await waitForOptions(fromSelect, 1, 15000);
    const toOptions = await waitForOptions(toSelect, 1, 15000);

    // Debug prints
    const fromTexts = await Promise.all(fromOptions.map(opt => opt.textContent()));
    const toTexts = await Promise.all(toOptions.map(opt => opt.textContent()));
    
    console.log('From options:', fromTexts.map(t => t.trim()));
    console.log('To options:', toTexts.map(t => t.trim()));

    // Guard: if either list is empty, fail with clear message
    if (fromOptions.length === 0 || toOptions.length === 0) {
      throw new Error(`Dropdown has no options: from=${fromOptions.length} to=${toOptions.length}`);
    }

    // Always select index 0 for 'from'
    const fromIndex = 0;
    
    // Prefer a different 'to' if available; otherwise use index 0 (same account is allowed)
    const toIndex = toOptions.length > 1 ? 1 : 0;

    // Select by index using Playwright's selectOption with nth-match
    const fromValue = await fromOptions[fromIndex].getAttribute('value');
    const toValue = await toOptions[toIndex].getAttribute('value');
    
    await fromSelect.selectOption(fromValue);
    await toSelect.selectOption(toValue);

    // 4) Amount + submit
    const amountField = page.locator('#amount');
    await amountField.waitFor({ state: 'visible' });
    await amountField.clear();
    await amountField.fill(AMOUNT);
    
    await page.click('input.button[value="Transfer"]');

    // 5) Verify confirmation
    const heading = page.locator('//h1[normalize-space()="Transfer Complete!" or normalize-space()="Transfer Complete"]');
    await heading.waitFor({ state: 'visible', timeout: 25000 });
    
    const isVisible = await heading.isVisible();
    if (!isVisible) {
      throw new Error('Confirmation heading not visible.');
    }

    // Get the specific paragraph with transfer details
    const detailLocator = page.locator('#showResult p').filter({ hasText: 'has been transferred' });
    await detailLocator.waitFor({ state: 'visible' });
    
    const detail = await detailLocator.textContent();
    const cleanDetail = detail.replace(/,/g, '');
    
    if (!cleanDetail.includes(AMOUNT)) {
      throw new Error(`Expected amount ${AMOUNT} in detail: ${detail}`);
    }

    await page.screenshot({ path: 'parabank_transfer_complete_indexsafe.png', fullPage: true });
    console.log('Test Passed: Transfer Complete. Detail:', detail);

  } catch (error) {
    await page.screenshot({ path: 'parabank_transfer_error_indexsafe.png', fullPage: true });
    
    // Dump context to help diagnose
    try {
      console.log('Current URL:', page.url());
    } catch (e) {}
    
    console.error('Test Failed:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
})();