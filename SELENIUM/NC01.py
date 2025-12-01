# NC01 – Login With Missing Username Field
# Test: Check how tools handle "element not found"
# Expected: Selenium/Playwright fails with "element not found"

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from webdriver_manager.chrome import ChromeDriverManager
import time

options = Options()
options.add_argument("--start-maximized")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
wait = WebDriverWait(driver, 10)

print("="*60)
print("NC01 – Login With Missing Username Field")
print("Testing: Wrong Locator → Element Not Found")
print("="*60)

try:
    # Navigate to OrangeHRM login page
    print("\n[1/3] Opening OrangeHRM login page...")
    driver.get("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login")
    time.sleep(2)
    print("      ✓ Page loaded")
    # Intentionally trigger a missing-element error to demonstrate error handling
    # This will raise NoSuchElementException and flow into the outer exception handlers
    driver.find_element(By.ID, "intentionally_missing_element")
    
    print("\n[2/3] Attempting to find username field with WRONG locator...")
    print("      Using: By.ID, 'wrong_username_id' (intentionally incorrect)")
    print("      Expected: By.NAME, 'username' (correct locator)")
    
    # INTENTIONALLY USE WRONG LOCATOR - This will fail
    try:
        username_field = wait.until(
            EC.visibility_of_element_located((By.ID, "wrong_username_id"))
        )
        username_field.send_keys("Admin")
        print("      ✓ Username field found (unexpected!)")
    except (NoSuchElementException, TimeoutException) as e:
        print(f"\n{'='*60}")
        print("FAILURE DETECTED: Element Not Found")
        print(f"{'='*60}")
        print(f"Exception Type: {type(e).__name__}")
        print(f"Error Message: {str(e)}")
        print(f"\nLocator Used: By.ID, 'wrong_username_id'")
        print(f"Expected Element: Username input field")
        print(f"Correct Locator Should Be: By.NAME, 'username'")
        print(f"\nSelenium Behavior:")
        print(f"  ✓ Raises {type(e).__name__}")
        print(f"  ✓ Test execution stops immediately")
        print(f"  ✗ No alternative element suggested")
        print(f"  ✗ No locator highlighting")
        print(f"  ✗ No similar elements shown")
        print(f"\nComparison with AI tools (Testim/Mabl):")
        print(f"  → Would suggest alternative locators (e.g., By.NAME, 'username')")
        print(f"  → Would highlight broken locator in code")
        print(f"  → Would show similar elements found on page")
        print(f"  → Would provide recovery suggestions")
        
        driver.save_screenshot("nc01_wrong_locator_failure.png")
        print(f"\n      ✓ Screenshot saved: nc01_wrong_locator_failure.png")
        
        # Save page source for debugging
        with open("nc01_failure_page_source.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        print(f"      ✓ Page source saved: nc01_failure_page_source.html")
        
        # Show what elements ARE available (for comparison)
        print(f"\n      Available input elements on page:")
        try:
            inputs = driver.find_elements(By.TAG_NAME, "input")
            for idx, inp in enumerate(inputs[:5], 1):
                name_attr = inp.get_attribute("name") or "N/A"
                id_attr = inp.get_attribute("id") or "N/A"
                print(f"        [{idx}] name='{name_attr}', id='{id_attr}'")
        except:
            pass
        
        raise  # Re-raise to demonstrate failure

except NoSuchElementException as e:
    print(f"\n{'='*60}")
    print("FINAL RESULT: NoSuchElementException")
    print(f"{'='*60}")
    print(f"This demonstrates basic failure detection:")
    print(f"  → Selenium fails fast with clear exception")
    print(f"  → No recovery mechanism")
    print(f"  → Manual debugging required")
    
except TimeoutException as e:
    print(f"\n{'='*60}")
    print("FINAL RESULT: TimeoutException")
    print(f"{'='*60}")
    print(f"Element not found within timeout period")
    driver.save_screenshot("nc01_timeout_failure.png")
    
except Exception as e:
    print(f"\n{'='*60}")
    print("UNEXPECTED ERROR")
    print(f"{'='*60}")
    print(f"Exception Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")
    driver.save_screenshot("nc01_unexpected_error.png")

finally:
    print(f"\n{'='*60}")
    print("Test completed - demonstrating element not found handling")
    print(f"{'='*60}")
    time.sleep(1)
    driver.quit()

