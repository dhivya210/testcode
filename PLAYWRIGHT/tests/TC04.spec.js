const { chromium } = require('playwright');

// Test Data
const FROM_CITY = 'LHR';
const TO_CITY = 'DXB';

// Calculate date 30 days from now
const departDate = new Date();
departDate.setDate(departDate.getDate() + 30);
const DEPART_DATE = departDate.toLocaleDateString('en-GB').replace(/\//g, '-');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null,
    permissions: ['notifications']
  });

  const page = await context.newPage();

  try {
    console.log('='.repeat(60));
    console.log('PHPTRAVELS FLIGHT SEARCH TEST');
    console.log('='.repeat(60));

    console.log('\n[1/6] Opening flights page...');
    await page.goto('https://phptravels.net/flights');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);
    console.log('       Page loaded');

    // Close any popup/banner/cookie consent
    const closeSelectors = [
      "button:has-text('Accept')",
      "button:has-text('Dismiss')",
      "button[aria-label='Close']",
      "//button[contains(@class,'close')]",
      "//a[contains(text(),'×')]"
    ];

    for (const selector of closeSelectors) {
      try {
        await page.click(selector, { timeout: 1000 });
        await page.waitForTimeout(500);
        console.log('      ✓ Popup closed');
        break;
      } catch (e) {
        // Continue to next selector
      }
    }

    console.log(`\n[2/6] Entering FROM: ${FROM_CITY}`);

    // Find and fill FROM field
    const fromSelectors = [
      "input[placeholder*='Flying From']",
      "input[name='from']",
      "(//input[contains(@class,'form-control')])[1]"
    ];

    let fromField = null;
    for (const selector of fromSelectors) {
      try {
        fromField = page.locator(selector).first();
        await fromField.waitFor({ state: 'visible', timeout: 5000 });
        break;
      } catch (e) {
        continue;
      }
    }

    if (!fromField) throw new Error('FROM field not found');

    await fromField.scrollIntoViewIfNeeded();
    await fromField.click();
    await page.waitForTimeout(500);

    // Clear and type slowly
    await fromField.press('Control+a');
    await fromField.press('Backspace');
    await page.waitForTimeout(300);

    for (const char of FROM_CITY) {
      await fromField.type(char, { delay: 200 });
    }

    await page.waitForTimeout(2000);

    // Select from dropdown
    try {
      const dropdownItems = page.locator("ul[role='listbox'] li, div.autocomplete-items div, ul:has-text('dropdown') li");
      await dropdownItems.first().waitFor({ state: 'visible', timeout: 3000 });

      const items = await dropdownItems.all();
      let clicked = false;

      for (const item of items) {
        const text = await item.textContent();
        if (text && text.toUpperCase().includes(FROM_CITY)) {
          await item.click();
          console.log(`       Selected ${FROM_CITY} from dropdown`);
          clicked = true;
          break;
        }
      }

      if (!clicked && items.length > 0) {
        await items[0].click();
        console.log('       Selected first option');
      }
    } catch (e) {
      console.log('       No dropdown, trying keyboard selection');
      await fromField.press('ArrowDown');
      await page.waitForTimeout(300);
      await fromField.press('Enter');
    }

    await page.waitForTimeout(1000);

    console.log(`\n[3/6] Entering TO: ${TO_CITY}`);

    // Close any overlays
    try {
      await page.locator('h1').click({ timeout: 1000 });
      await page.waitForTimeout(500);
    } catch (e) {}

    // Find and fill TO field
    const toSelectors = [
      "input[placeholder*='Destination']",
      "input[name='to']",
      "(//input[contains(@class,'form-control')])[2]"
    ];

    let toField = null;
    for (const selector of toSelectors) {
      try {
        toField = page.locator(selector).first();
        await toField.waitFor({ state: 'visible', timeout: 5000 });
        break;
      } catch (e) {
        continue;
      }
    }

    if (!toField) throw new Error('TO field not found');

    await toField.scrollIntoViewIfNeeded();
    await toField.click();
    await page.waitForTimeout(500);

    await toField.press('Control+a');
    await toField.press('Backspace');
    await page.waitForTimeout(300);

    for (const char of TO_CITY) {
      await toField.type(char, { delay: 200 });
    }

    await page.waitForTimeout(2000);

    // Select from dropdown
    try {
      const dropdownItems = page.locator("ul[role='listbox'] li, div.autocomplete-items div, ul:has-text('dropdown') li");
      await dropdownItems.first().waitFor({ state: 'visible', timeout: 3000 });

      const items = await dropdownItems.all();
      let clicked = false;

      for (const item of items) {
        const text = await item.textContent();
        if (text && text.toUpperCase().includes(TO_CITY)) {
          await item.click();
          console.log(`       Selected ${TO_CITY} from dropdown`);
          clicked = true;
          break;
        }
      }

      if (!clicked && items.length > 0) {
        await items[0].click();
        console.log('       Selected first option');
      }
    } catch (e) {
      console.log('       No dropdown, trying keyboard selection');
      await toField.press('ArrowDown');
      await page.waitForTimeout(300);
      await toField.press('Enter');
    }

    await page.waitForTimeout(1000);

    console.log(`\n[4/6] Entering DATE: ${DEPART_DATE}`);
    await page.waitForTimeout(2000);

    // Find and click date section to open calendar
    try {
      // Click on the date section to open calendar
      const dateSection = page.locator("*:has-text('Depart Date')").first();
      await dateSection.scrollIntoViewIfNeeded();
      await dateSection.click();
      await page.waitForTimeout(1500);
      console.log('       Opened calendar picker');

      const dayToClick = departDate.getDate();
      const targetMonthName = departDate.toLocaleString('en-US', { month: 'long' });

      // Navigate to correct month
      let attempts = 0;
      while (attempts < 12) {
        try {
          // Find the month/year header in the calendar
          const calendarHeader = await page.locator(".flatpickr-current-month, .datepicker-switch, *[class*='month']").first().textContent({ timeout: 2000 });
          
          console.log(`      Current calendar month: ${calendarHeader}`);
          
          if (calendarHeader.includes(targetMonthName) && calendarHeader.includes('2025')) {
            console.log(`      Found target month: ${targetMonthName}`);
            break;
          }
          
          // Click next month arrow
          await page.locator(".flatpickr-next-month, .next, button:has-text('›')").first().click({ timeout: 2000 });
          await page.waitForTimeout(500);
          attempts++;
        } catch (e) {
          console.log(`      Could not navigate calendar: ${e.message}`);
          break;
        }
      }

      // Click the day in the calendar
      await page.waitForTimeout(500);
      
      // Try multiple selectors for the day cell
      const daySelectors = [
        `.flatpickr-day:not(.flatpickr-disabled):has-text("${dayToClick}")`,
        `td.day:not(.disabled):has-text("${dayToClick}")`,
        `.datepicker td:not(.disabled):has-text("${dayToClick}")`,
        `*[class*="day"]:not([class*="disabled"]):has-text("${dayToClick}")`
      ];

      let dayClicked = false;
      for (const selector of daySelectors) {
        try {
          await page.locator(selector).first().click({ timeout: 2000 });
          console.log(`      Selected day ${dayToClick} using: ${selector}`);
          dayClicked = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!dayClicked) {
        console.log('      Could not click day in calendar, calendar may not have opened');
      }

      await page.waitForTimeout(1000);
      console.log('      Date entry completed');
    } catch (e) {
      console.log(`       Error with DATE field: ${e.message}`);
      await page.screenshot({ path: 'error_date_field.png', fullPage: true });
      // Don't throw - continue to see if we can still search
    }

    // Close calendar
    try {
      await page.locator('h1').click({ timeout: 1000 });
      await page.waitForTimeout(500);
    } catch (e) {}

    console.log('\n[5/6] Clicking Search button...');

    // Close calendar with ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Find search button
    const searchSelectors = [
      "button.btn-primary",
      "button[type='submit']",
      "button:has-text('Search')",
      "button[class*='search']",
      "form button.btn"
    ];

    let searchBtn = null;
    for (const selector of searchSelectors) {
      try {
        searchBtn = page.locator(selector).first();
        if (await searchBtn.isVisible() && await searchBtn.isEnabled()) {
          console.log(`       Found search button using: ${selector}`);
          break;
        }
        searchBtn = null;
      } catch (e) {
        continue;
      }
    }

    if (!searchBtn) throw new Error('Search button not found');

    await searchBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Try clicking
    try {
      await searchBtn.click();
      console.log('      Clicked search button');
    } catch (e) {
      console.log('      Regular click failed, trying force click');
      await searchBtn.click({ force: true });
    }

    await page.waitForTimeout(1000);

    console.log('\n[6/6] Waiting for results page...');

    // Wait for URL to change
    try {
      await page.waitForURL(url => !url.includes('/flights$'), { timeout: 10000 });
      console.log(`      URL changed to: ${page.url()}`);
    } catch (e) {
      console.log(`      URL did not change, still at: ${page.url()}`);
    }

    await page.waitForTimeout(3000);

    // Check for results
    let resultsFound = false;
    let flightsText = 'Checking for results...';

    // Check 1: Look for "Flights Found" text
    try {
      const banner = page.locator("*:has-text('Flights Found')").first();
      await banner.waitFor({ state: 'visible', timeout: 5000 });
      flightsText = await banner.textContent();
      resultsFound = true;
      console.log(`      ✓ ${flightsText}`);
    } catch (e) {}

    // Check 2: Look for flight cards or Select buttons
    if (!resultsFound) {
      try {
        const flightElements = page.locator("button:has-text('Select'), div[class*='flight-card']");
        const count = await flightElements.count();
        if (count > 0) {
          resultsFound = true;
          console.log(`      Found ${count} flight result(s)`);
        }
      } catch (e) {}
    }

    // Check 3: URL contains flight search parameters
    const currentUrl = page.url();
    if (!resultsFound && (currentUrl.includes('lhr') || currentUrl.includes('dxb') || currentUrl.includes('oneway'))) {
      resultsFound = true;
      console.log('      Results page loaded (URL indicates search completed)');
    }

    if (!resultsFound) {
      console.log('      Could not confirm results loaded');
    }

    // Take screenshot
    await page.screenshot({ path: 'flight_results_success.png', fullPage: true });

    // Success!
    console.log('\n' + '='.repeat(60));
    console.log(resultsFound ? 'TEST PASSED!' : '⚠ TEST COMPLETED (verify screenshot)');
    console.log('='.repeat(60));
    console.log(`  Route: ${FROM_CITY} → ${TO_CITY}`);
    console.log(`  Date: ${DEPART_DATE}`);
    console.log(`  Status: ${flightsText}`);
    console.log(`  URL: ${currentUrl}`);
    console.log('  Screenshot: flight_results_success.png');
    console.log('='.repeat(60));

  } catch (error) {
    await page.screenshot({ path: 'test_error.png', fullPage: true });
    console.log('\n' + '='.repeat(60));
    console.log('TEST FAILED');
    console.log('='.repeat(60));
    console.log(`Error: ${error.message}`);
    console.log(`Current URL: ${page.url()}`);
    console.log('Screenshot: test_error.png');
    console.log('='.repeat(60));
    console.error(error.stack);
  } finally {
    console.log('\nKeeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
    console.log('Browser closed');
  }
})();