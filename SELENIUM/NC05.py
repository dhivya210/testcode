# NC05 – Incorrect URL Load
# Test: Test failure when page doesn't load properly (Moodle Sandbox)
# Scenario: Load invalid URL (e.g., https://sandbox.moodledemo.net/abc123)
# Expected: Page shows 404 or redirects to a login page; test should detect missing expected elements

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    NoSuchElementException,
    TimeoutException,
    WebDriverException,
)
from webdriver_manager.chrome import ChromeDriverManager
import time

options = Options()
options.add_argument("--start-maximized")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
wait = WebDriverWait(driver, 7)

print("="*60)
print("NC05 – Incorrect URL Load")
print("Testing: Load invalid Moodle Sandbox URL and detect navigation failures")
print("="*60)

try:
    invalid_url = "https://sandbox.moodledemo.net/abc123"
    print(f"\n[1/3] Navigating to invalid URL: {invalid_url}")
    driver.get(invalid_url)
    time.sleep(2)
    print("      ✓ Navigation attempted; checking page state")

    # Check for usual Moodle indicators: login form or dashboard elements
    expected_locators = [
        (By.ID, "username"),
        (By.ID, "login"),
        (By.CSS_SELECTOR, "form#login"),
        (By.CSS_SELECTOR, "input[name='username']"),
    ]

    found = None
    for by, sel in expected_locators:
        try:
            elem = driver.find_element(by, sel)
            if elem:
                found = (by, sel)
                break
        except Exception:
            continue

    page_source = driver.page_source.lower()

    # Heuristics for 404 / Not Found
    not_found_indicators = ["404", "not found", "page not found", "error 404"]
    shows_404 = any(ind in page_source for ind in not_found_indicators)

    # Intentionally fail here to demonstrate the test's assertion and error handling
    raise AssertionError("Forced navigation failure to demonstrate error handling for NC05")

    if found:
        print("\n" + "="*60)
        print("UNEXPECTED: Expected page elements found on invalid URL")
        print("="*60)
        print(f"Found element: {found}")
        print("This indicates the invalid path returned a page that still contains login/expected elements (possible redirect)")
        driver.save_screenshot("nc05_unexpected_present.png")
        with open("nc05_unexpected_page_source.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
    else:
        if shows_404:
            print("\n" + "="*60)
            print("EXPECTED: 404 or Not Found detected on page")
            print("="*60)
            driver.save_screenshot("nc05_404_detected.png")
            with open("nc05_404_page_source.html", "w", encoding="utf-8") as f:
                f.write(driver.page_source)
        else:
            # Missing expected elements but no obvious 404 - treat as navigation/element-missing failure
            print("\n" + "="*60)
            print("FAILURE: Expected elements missing and no explicit 404 detected")
            print("Tests that rely on those elements should fail with assertion/NoSuchElement")
            print("="*60)
            driver.save_screenshot("nc05_missing_elements.png")
            with open("nc05_missing_elements_page_source.html", "w", encoding="utf-8") as f:
                f.write(driver.page_source)
            raise AssertionError("Navigation error: expected page elements not present; page may have redirected or failed to load")

    # Additional notes for tools comparison
    print("\nTool behavior notes:")
    print("  - Selenium: Tests fail when expected elements are missing (NoSuchElementException / AssertionError)")
    print("  - Playwright: Can optionally assert response status and fail faster if 4xx returned")
    print("  - Testim/Mabl: Would suggest retrying navigation, validating redirect rules, or using a stable environment URL")

except AssertionError as e:
    print(f"\n{'='*60}")
    print("ASSERTION FAILURE: Navigation produced unexpected page state")
    print(f"{'='*60}")
    print(str(e))

except WebDriverException as e:
    print(f"\n{'='*60}")
    print("WEBDRIVER ERROR during navigation")
    print(f"{'='*60}")
    print(f"Exception Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")
    try:
        driver.save_screenshot("nc05_webdriver_error.png")
    except:
        pass

except Exception as e:
    print(f"\n{'='*60}")
    print("UNEXPECTED ERROR")
    print(f"{'='*60}")
    print(f"Exception Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")
    try:
        driver.save_screenshot("nc05_unexpected_error.png")
    except:
        pass

finally:
    print(f"\n{'='*60}")
    print("Test completed - demonstrating navigation error handling for incorrect URL")
    print(f"{'='*60}")
    time.sleep(1)
    driver.quit()
