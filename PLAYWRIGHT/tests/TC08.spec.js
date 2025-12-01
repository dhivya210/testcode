const { chromium } = require('playwright');

const BASE = 'https://sandbox.moodledemo.net';
const USERNAME = 'admin';
const PASSWORD = 'sandbox24';
const TARGET_USER = 'Max Manager';

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
    console.log('MOODLE VIEW PARTICIPANTS TEST');
    console.log('='.repeat(60));

    // 1) Login
    console.log('\n[1/5] Logging in...');
    await page.goto(`${BASE}/login/index.php`);
    await page.waitForTimeout(2000);

    await page.fill('#username', USERNAME);
    await page.fill('#password', PASSWORD);
    await page.click('#loginbtn');
    await page.waitForTimeout(3000);
    console.log('      Login submitted');

    // Check for login errors
    try {
      const alert = await page.locator('div[role="alert"], .alert').first();
      if (await alert.isVisible({ timeout: 3000 })) {
        const alertText = await alert.textContent();
        if (alertText.toLowerCase().includes('invalid') || alertText.toLowerCase().includes('incorrect')) {
          throw new Error(`Login failed: ${alertText.trim()}`);
        }
      }
    } catch (e) {
      // No alert or already handled
    }

    // Wait for dashboard
    await page.waitForURL(url => !url.toString().toLowerCase().includes('login'), { timeout: 15000 });
    console.log('      Logged in successfully');
    await page.waitForTimeout(2000);

    // 2) Find and enter a course
    console.log('\n[2/5] Looking for a course to enter...');

    let courseLink = null;
    const courseSelectors = [
      "a[href*='/course/view.php']",
      "div[class*='course'] a",
      "h3 a, h4 a",
      "a[href*='course/view']"
    ];

    for (const selector of courseSelectors) {
      try {
        const courses = await page.locator(selector).all();
        for (const course of courses) {
          const href = await course.getAttribute('href') || '';
          const text = (await course.textContent()).trim();
          if (href.includes('course/view.php') && text && text.length > 3) {
            courseLink = course;
            console.log(`      ✓ Found course: '${text}'`);
            break;
          }
        }
        if (courseLink) break;
      } catch (e) {
        continue;
      }
    }

    if (!courseLink) {
      // Try to navigate to site home
      console.log('      No course found, trying Site home...');
      await page.goto(`${BASE}/`);
      await page.waitForTimeout(2000);

      try {
        await page.click('text="Home"', { timeout: 3000 });
        await page.waitForTimeout(2000);
        console.log('      Clicked "Home"');
      } catch (e) {
        // Continue anyway
      }
    } else {
      // Click on the course
      await courseLink.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await courseLink.click();
      await page.waitForTimeout(3000);
      console.log('      Entered course');
    }

    console.log(`      Current URL: ${page.url()}`);

    // 3) Click on "Participants" tab
    console.log('\n[3/5] Looking for "Participants" link...');
    await page.waitForTimeout(2000);

    let participantsLink = null;
    const participantsSelectors = [
      'text="Participants"',
      'a:has-text("Participants")',
      '//a[normalize-space()="Participants"]',
      '//nav//a[contains(text(),"Participants")]',
      'a[href*="user/index.php"]'
    ];

    for (const selector of participantsSelectors) {
      try {
        participantsLink = page.locator(selector).first();
        await participantsLink.waitFor({ state: 'visible', timeout: 5000 });
        console.log('      ✓ Found "Participants" link');
        break;
      } catch (e) {
        participantsLink = null;
        continue;
      }
    }

    if (!participantsLink) {
      // Debug: show navigation links
      console.log('      DEBUG: Available navigation links:');
      const navLinks = await page.locator('nav a, ul[class*="nav"] a').all();
      for (let idx = 0; idx < Math.min(navLinks.length, 15); idx++) {
        const text = (await navLinks[idx].textContent()).trim();
        if (text) {
          console.log(`      [${idx}] ${text}`);
        }
      }

      await page.screenshot({ path: 'debug_no_participants.png', fullPage: true });
      throw new Error('Could not find "Participants" link - may need to enter a course first');
    }

    // Click Participants
    await participantsLink.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await participantsLink.click();
    await page.waitForTimeout(3000);
    console.log('      Clicked "Participants"');
    console.log(`      Current URL: ${page.url()}`);

    // 4) Wait for participants list
    console.log('\n[4/5] Waiting for participants list to load...');

    // Check for error messages first
    try {
      const error = page.locator('//*[contains(text(),"Can") and contains(text(),"find")]');
      if (await error.isVisible({ timeout: 2000 })) {
        const errorText = await error.textContent();
        console.log(`      Error found: ${errorText}`);
        await page.screenshot({ path: 'error_found.png', fullPage: true });
        throw new Error('Database error on participants page');
      }
    } catch (e) {
      // No error, good
    }

    // Wait for participants table or list
    let participantsLoaded = false;
    const loadSelectors = [
      "table[class*='generaltable']",
      "//*[contains(text(),'participants') or contains(text(),'users')]",
      "div[class*='userlist'], div[class*='participants']"
    ];

    for (const selector of loadSelectors) {
      try {
        await page.locator(selector).first().waitFor({ state: 'visible', timeout: 10000 });
        console.log('      Participants list loaded');
        participantsLoaded = true;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!participantsLoaded) {
      console.log('      Could not confirm participants loaded');
      await page.screenshot({ path: 'debug_participants_load.png', fullPage: true });
    }

    // Get count if available
    try {
      const countElem = page.locator("//*[contains(text(),'participants') or contains(text(),'users found')]").first();
      if (await countElem.isVisible({ timeout: 2000 })) {
        const countText = await countElem.textContent();
        console.log(`      ✓ ${countText}`);
      }
    } catch (e) {
      // No count available
    }

    await page.waitForTimeout(2000);

    // 5) Find Max Manager
    console.log(`\n[5/5] Searching for '${TARGET_USER}'...`);

    // Scroll to see more participants
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Search for Max Manager
    let maxLink = null;
    const maxSelectors = [
      'text="Max Manager"',
      'a:has-text("Max Manager")',
      '//a[contains(text(),"Max Manager")]',
      '//a[contains(text(),"Max") and contains(text(),"Manager")]',
      '//td[contains(text(),"Max")]/following-sibling::td//a | //td[contains(text(),"Max")]//a'
    ];

    for (const selector of maxSelectors) {
      try {
        maxLink = page.locator(selector).first();
        if (await maxLink.isVisible({ timeout: 2000 })) {
          console.log(`      ✓ Found '${TARGET_USER}'`);
          break;
        }
        maxLink = null;
      } catch (e) {
        maxLink = null;
        continue;
      }
    }

    if (!maxLink) {
      // Debug
      console.log('      DEBUG: Searching for user links...');
      const userLinks = await page.locator('table a, div[class*="user"] a').all();
      console.log(`      Found ${userLinks.length} links:`);
      
      for (let idx = 0; idx < Math.min(userLinks.length, 15); idx++) {
        const text = (await userLinks[idx].textContent()).trim();
        const href = await userLinks[idx].getAttribute('href') || '';
        if (text && href.includes('user')) {
          console.log(`      [${idx}] ${text}`);
        }
      }

      // Check if Max is on page at all
      const pageContent = await page.content();
      if (pageContent.includes('Max')) {
        console.log('      "Max" text exists on page');
        try {
          const maxElements = await page.locator('//*[contains(text(),"Max")]').all();
          for (let i = 0; i < Math.min(maxElements.length, 5); i++) {
            const text = await maxElements[i].textContent();
            console.log(`        Found: ${text}`);
          }
        } catch (e) {
          // Continue
        }
      } else {
        console.log('      "Max" text NOT on page');
      }

      await page.screenshot({ path: 'debug_max_not_found.png', fullPage: true });
      console.log(`      ⚠ Could not find '${TARGET_USER}'`);
    } else {
      // Click on profile
      await maxLink.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await maxLink.click();
      await page.waitForTimeout(3000);
      console.log(`      ✓ Clicked on '${TARGET_USER}' profile`);

      // Verify profile loaded
      try {
        const profileElem = page.locator('//*[contains(text(),"Max Manager") or contains(text(),"User details")]').first();
        if (await profileElem.isVisible({ timeout: 3000 })) {
          const profileText = await profileElem.textContent();
          console.log(`      Profile page loaded: ${profileText.substring(0, 50)}`);
        }
      } catch (e) {
        console.log('      ⚠ Could not verify profile page');
      }
    }

    // Final screenshot
    await page.screenshot({ path: 'moodle_result.png', fullPage: true });

    console.log('\n' + '='.repeat(60));
    if (maxLink) {
      console.log(`TEST PASSED: Found '${TARGET_USER}'`);
    } else {
      console.log(`⚠ TEST PARTIAL: Reached participants but '${TARGET_USER}' not found`);
    }
    console.log('='.repeat(60));
    console.log(`  Final URL: ${page.url()}`);
    console.log('  Screenshot: moodle_result.png');
    console.log('='.repeat(60));

  } catch (error) {
    await page.screenshot({ path: 'moodle_fail.png', fullPage: true });
    console.log('\n' + '='.repeat(60));
    console.log('TEST FAILED');
    console.log('='.repeat(60));
    console.log(`Error: ${error.message}`);
    console.log(`Current URL: ${page.url()}`);
    console.log('Screenshot: moodle_fail.png');
    console.log('='.repeat(60));
    console.error(error.stack);
  } finally {
    console.log('\nKeeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
    console.log('Browser closed');
  }
})();