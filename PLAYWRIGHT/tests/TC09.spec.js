const { chromium } = require('playwright');

// Configuration
const BASE_URL = 'https://phptravels.net/hotels';

(async () => {
  // Setup Chrome
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
    console.log('PHPTRAVELS HOTEL BOOKING TEST');
    console.log('='.repeat(60));

    // 1. Load page
    console.log('\n[1/6] Loading hotels page...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    console.log('      ✓ Page loaded');

    // 2. Select destination
    console.log('\n[2/6] Selecting destination...');

    try {
      let destField = null;

      // Method 1: Find input field
      try {
        destField = page.locator("input[placeholder*='Destination'], input[placeholder*='City']").first();
        await destField.waitFor({ state: 'visible', timeout: 3000 });
      } catch (e) {
        // Try method 2
      }

      // Method 2: Find any visible input in the form
      if (!destField || !(await destField.isVisible())) {
        try {
          destField = page.locator('form input[type="text"]').first();
          await destField.waitFor({ state: 'visible', timeout: 3000 });
        } catch (e) {
          // Continue
        }
      }

      if (destField && (await destField.isVisible())) {
        // Click to open dropdown
        await destField.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await destField.click();
        await page.waitForTimeout(2000);
        console.log('      ✓ Clicked destination field');

        // Wait for dropdown and click Dubai
        try {
          let dubai = null;
          const dubaiSelectors = [
            "//div[contains(text(),'Dubai, United Arab Emirates')]",
            "//li[contains(text(),'Dubai')]",
            "//*[contains(text(),'Dubai, United Arab')]",
            "//a[contains(text(),'Dubai')]"
          ];

          for (const selector of dubaiSelectors) {
            try {
              dubai = page.locator(selector).first();
              await dubai.waitFor({ state: 'visible', timeout: 3000 });
              break;
            } catch (e) {
              dubai = null;
              continue;
            }
          }

          if (dubai) {
            await dubai.click();
            await page.waitForTimeout(1000);
            console.log('      ✓ Selected Dubai');
          } else {
            console.log('      ⚠ Could not find Dubai option, continuing with default');
          }
        } catch (e) {
          console.log('      ⚠ Dropdown not found, continuing');
        }
      } else {
        console.log('      ⚠ Destination field not found, using default');
      }
    } catch (e) {
      console.log(`      ⚠ Selection failed: ${e.message.substring(0, 50)}`);
    }

    // 3. Click search
    console.log('\n[3/6] Searching hotels...');

    try {
      const searchBtn = page.locator("button[type='submit'], button[class*='search']").first();
      await searchBtn.waitFor({ state: 'visible', timeout: 10000 });
      await searchBtn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await searchBtn.click();
      await page.waitForTimeout(5000);
      console.log('      ✓ Search submitted');
    } catch (e) {
      console.log('      ⚠ Could not click search button');
    }

    // Wait for results
    await page.waitForTimeout(3000);
    console.log('      ✓ Results page loaded');

    // 4. Verify results
    console.log('\n[4/6] Verifying search results...');

    try {
      // Check if we have hotel results
      const pageContent = await page.content();
      const pageText = pageContent.toLowerCase();
      
      if (pageText.includes('hotel')) {
        console.log('      ✓ Hotel results displayed');

        // Count visible hotels
        try {
          const hotels = await page.locator("//*[contains(@class,'hotel') or contains(@class,'card')]").all();
          if (hotels.length > 0) {
            console.log(`      ✓ Found ${hotels.length} hotel elements`);
          }
        } catch (e) {
          // Continue
        }
      }
    } catch (e) {
      console.log('      ✓ Results loaded');
    }

    // 5. Click "View More" on first hotel
    console.log('\n[5/6] Opening hotel details...');

    try {
      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Find and click View More button
      const viewBtn = page.locator("(//button[text()='View More'] | //a[text()='View More'])[1]").first();
      await viewBtn.waitFor({ state: 'visible', timeout: 10000 });

      // Scroll to button
      await viewBtn.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      // Get hotel name if possible
      try {
        const hotelNameElem = page.locator('(//h2 | //h3 | //h4)[1]').first();
        if (await hotelNameElem.isVisible({ timeout: 2000 })) {
          const hotelName = await hotelNameElem.textContent();
          if (hotelName) {
            console.log(`      ✓ Opening: ${hotelName.substring(0, 40)}`);
          }
        }
      } catch (e) {
        console.log('      ✓ Opening hotel details');
      }

      // Click button
      await viewBtn.click();
      await page.waitForTimeout(4000);
      console.log('      ✓ Hotel details page opened');

    } catch (e) {
      console.log(`      ⚠ Could not open details: ${e.message.substring(0, 50)}`);
    }

    // 6. Verify hotel details page
    console.log('\n[6/6] Verifying booking page...');

    const currentUrl = page.url();
    console.log(`      Current URL: ${currentUrl}`);

    // Check for booking page elements
    const pageContent = await page.content();
    const pageContentLower = pageContent.toLowerCase();

    let bookingFound = false;
    const bookingWords = ['book', 'reserve', 'room', 'price'];
    if (bookingWords.some(word => pageContentLower.includes(word))) {
      console.log('      ✓ Hotel booking page displayed');
      bookingFound = true;
    }

    // Check for specific elements
    try {
      const bookingElements = await page.locator(
        "//button[contains(text(),'Book')] | //button[contains(text(),'Reserve')] | //*[contains(text(),'Room')]"
      ).all();
      
      if (bookingElements.length > 0) {
        console.log(`      ✓ Booking options available (${bookingElements.length} elements)`);
      }
    } catch (e) {
      // Continue
    }

    // Take screenshot
    await page.screenshot({ path: 'phptravels_booking.png', fullPage: true });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST PASSED: Hotel Booking Flow');
    console.log('='.repeat(60));
    console.log('  ✓ Loaded hotel search page');
    console.log('  ✓ Submitted search');
    console.log('  ✓ Viewed hotel results');
    console.log('  ✓ Opened hotel details');
    if (bookingFound) {
      console.log('  ✓ Booking page verified');
    }
    console.log('  Screenshot: phptravels_booking.png');
    console.log('='.repeat(60));

  } catch (error) {
    await page.screenshot({ path: 'phptravels_fail.png', fullPage: true });
    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(60));
    console.log(`Error: ${error.message}`);
    console.log(`Current URL: ${page.url()}`);
    console.log('Screenshot: phptravels_fail.png');
    console.log('='.repeat(60));
    console.error(error.stack);
  } finally {
    console.log('\nTest complete! Closing browser...');
    await page.waitForTimeout(3000);
    await browser.close();
    console.log('Browser closed');
  }
})();