const { chromium } = require('playwright');

const INVALID_EMP_ID = 'ZZZ999999999';

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
    // Login
    await page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
    
    await page.fill('input[name="username"]', 'Admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Go to PIM → Employee List
    await page.locator('//span[normalize-space()="PIM"]').click();
    await page.locator('//h5[normalize-space()="Employee Information"]').waitFor({ state: 'visible' });

    // Reset any previous filters (important if the grid is sticky)
    try {
      const resetButton = page.locator('//button[normalize-space()="Reset"]');
      await resetButton.click({ timeout: 5000 });
      
      // Wait for loading to complete
      await page.waitForTimeout(1000);
    } catch (e) {
      // Reset not strictly required but helpful
    }

    // Enter an invalid Employee Id (free-text field, not autocomplete)
    const empIdField = page.locator('//label[normalize-space()="Employee Id"]/following::input[1]');
    await empIdField.waitFor({ state: 'visible' });
    await empIdField.clear();
    await empIdField.fill(INVALID_EMP_ID);

    // Click Search
    await page.locator('//button[normalize-space()="Search"]').click();

    // Verify "No Records Found" OR zero data rows
    let noRecordsFound = false;

    try {
      const noRecordsElement = page.locator('//div[contains(@class,"oxd-table")]//span[normalize-space()="No Records Found"]');
      await noRecordsElement.waitFor({ state: 'visible', timeout: 20000 });
      noRecordsFound = true;
    } catch (e) {
      // Element not found, check for zero rows instead
    }

    // Fallback: count rows in table body
    const rows = page.locator('//div[contains(@class,"oxd-table-body")]/div[contains(@class,"oxd-table-card")]');
    const rowCount = await rows.count();

    // Take screenshot
    await page.screenshot({ path: 'orangehrm_employee_list_invalid_search_fixed.png', fullPage: true });

    // Assert no records found or zero rows
    if (noRecordsFound || rowCount === 0) {
      console.log("Test Passed: 'No Records Found' displayed (or zero rows); app did not crash.");
    } else {
      throw new Error(`Expected 'No Records Found' or zero rows, but found ${rowCount} rows.`);
    }

  } catch (error) {
    await page.screenshot({ path: 'orangehrm_employee_list_invalid_search_fixed_fail.png', fullPage: true });
    console.error('Test Failed:', error.message);
  } finally {
    await browser.close();
  }
})();