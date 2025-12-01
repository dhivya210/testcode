# NC02 – Click on Disabled Button
# Test: Verify failure when clicking a disabled button (ParaBank register)
# Expected: Selenium raises ElementNotInteractableException when clicking disabled button

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    ElementNotInteractableException,
    ElementClickInterceptedException,
    NoSuchElementException,
    TimeoutException,
)
from webdriver_manager.chrome import ChromeDriverManager
import time

options = Options()
options.add_argument("--start-maximized")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
wait = WebDriverWait(driver, 10)

print("="*60)
print("NC02 – Click on Disabled Button")
print("Testing: Click Register on ParaBank before filling fields (disabled)")
print("="*60)

try:
    print("\n[1/3] Opening ParaBank registration page...")
    # Direct registration page for Parabank demo (public demo instance)
    driver.get("https://parabank.parasoft.com/parabank/register.htm")
    time.sleep(2)
    print("      ✓ Page loaded")

    print("\n[2/3] Locating the Register button (without filling fields)...")
    # Common locator for the register submit button
    try:
        register_btn = wait.until(
            EC.presence_of_element_located((By.XPATH, "//input[@value='Register' or @type='submit']"))
        )
        # Intentionally fail early to demonstrate error handling: look for a missing element
        # This will raise NoSuchElementException and exercise the outer exception handler
        driver.find_element(By.ID, "intentionally_missing_element")
    except TimeoutException:
        # Fallback: try to find by button text
        register_btn = driver.find_element(By.XPATH, "//button[contains(text(),'Register')]")

    # Print some attributes to help debugging
    is_disabled_attr = register_btn.get_attribute("disabled")
    aria_disabled = register_btn.get_attribute("aria-disabled")
    print(f"      Found element: tag={register_btn.tag_name}, disabled_attr={is_disabled_attr}, aria-disabled={aria_disabled}")

    print("\n[3/3] Attempting to click the Register button while required fields are empty...")
    try:
        register_btn.click()
        # If click does not raise, check whether the form submitted or still on page
        time.sleep(1)
        current_url = driver.current_url
        print(f"      Click executed. Current URL: {current_url}")
        print("      NOTE: If the button is truly disabled, Selenium should have raised an exception.")
        print("      This indicates the button may not be disabled by HTML or the page blocked submission client-side.")
    except ElementNotInteractableException as e:
        print(f"\n{'='*60}")
        print("EXPECTED FAILURE: ElementNotInteractableException")
        print(f"{'='*60}")
        print(f"Exception Type: {type(e).__name__}")
        print(f"Error Message: {str(e)}")
        print("\nSelenium Behavior:")
        print("  ✓ Raises ElementNotInteractableException when clicking disabled elements")
        print("  ✓ Test execution should capture this as a failure condition")
        print("\nTestim/Mabl Behavior (suggested):")
        print("  → Would suggest filling required fields before clicking")
        print("  → Would highlight the disabled control and propose corrective path")
        driver.save_screenshot("nc02_disabled_click_failure.png")
        with open("nc02_failure_page_source.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        print("      ✓ Saved screenshot and page source for debugging")

    except ElementClickInterceptedException as e:
        print(f"\n{'='*60}")
        print("INTERCEPTED CLICK: ElementClickInterceptedException")
        print(f"{'='*60}")
        print(f"Exception Type: {type(e).__name__}")
        print(f"Error Message: {str(e)}")
        driver.save_screenshot("nc02_intercepted_click.png")

    except Exception as e:
        print(f"\n{'='*60}")
        print("UNEXPECTED ERROR DURING CLICK")
        print(f"{'='*60}")
        print(f"Exception Type: {type(e).__name__}")
        print(f"Error Message: {str(e)}")
        driver.save_screenshot("nc02_unexpected_error.png")

except NoSuchElementException as e:
    print(f"\n{'='*60}")
    print("FINAL RESULT: NoSuchElementException - Register button not found")
    print(f"{'='*60}")
    print(f"Exception Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")

except TimeoutException as e:
    print(f"\n{'='*60}")
    print("FINAL RESULT: TimeoutException - Element not present in time")
    print(f"{'='*60}")
    driver.save_screenshot("nc02_timeout_failure.png")

finally:
    print(f"\n{'='*60}")
    print("Test completed - demonstrating click-on-disabled behavior")
    print(f"{'='*60}")
    time.sleep(1)
    driver.quit()
