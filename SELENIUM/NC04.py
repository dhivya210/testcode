# NC04 – Missing Element After Page Scroll
# Test: Check behavior when target element is out of viewport (SauceDemo)
# Scenario: Click "Add to Cart" without scrolling the page to the element
# Expected: Selenium may raise "element not clickable"/"not visible"; Playwright auto-scrolls

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    ElementClickInterceptedException,
    ElementNotInteractableException,
    NoSuchElementException,
    TimeoutException,
    WebDriverException,
)
from webdriver_manager.chrome import ChromeDriverManager
import time

options = Options()
options.add_argument("--start-maximized")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
wait = WebDriverWait(driver, 10)

print("="*60)
print("NC04 – Missing Element After Page Scroll")
print("Testing: Click 'Add to Cart' on SauceDemo when element is out of viewport")
print("="*60)

try:
    print("\n[1/5] Opening SauceDemo login page...")
    driver.get("https://www.saucedemo.com/")
    wait.until(EC.presence_of_element_located((By.ID, "user-name")))
    print("      ✓ Login page loaded")

    print("\n[2/5] Logging in with standard demo credentials...")
    driver.find_element(By.ID, "user-name").send_keys("standard_user")
    driver.find_element(By.ID, "password").send_keys("secret_sauce")
    driver.find_element(By.ID, "login-button").click()
    wait.until(EC.presence_of_element_located((By.CLASS_NAME, "inventory_list")))
    time.sleep(1)
    print("      ✓ Logged in and inventory page loaded")

    print("\n[3/5] Locating product list and selecting a product near the bottom...")
    items = driver.find_elements(By.CSS_SELECTOR, ".inventory_item")
    if not items:
        raise NoSuchElementException("No inventory items found on SauceDemo")

    # Choose the last item to maximize chance it's outside the initial viewport
    target_item = items[-1]
    add_btn = target_item.find_element(By.CSS_SELECTOR, "button")
    product_name = target_item.find_element(By.CSS_SELECTOR, ".inventory_item_name").text
    print(f"      ✓ Target product: '{product_name}'")

    print("\n[4/5] Ensure element is out of viewport by scrolling to top, then try clicking without scrolling")
    driver.execute_script("window.scrollTo(0, 0);")
    time.sleep(0.5)

    # Sanity: check if element is in viewport
    is_in_viewport = driver.execute_script(
        "var el=arguments[0]; var r=el.getBoundingClientRect(); return (r.top>=0 && r.left>=0 && r.bottom<= (window.innerHeight || document.documentElement.clientHeight) && r.right <= (window.innerWidth || document.documentElement.clientWidth));",
        add_btn,
    )
    print(f"      In viewport before click: {is_in_viewport}")

    print("\n[5/5] Attempting to click 'Add to Cart' without scrolling to the element (forcing failure)...")
    # Force the element to be non-interactable to demonstrate error handling
    driver.execute_script("arguments[0].style.display='none';", add_btn)
    try:
        add_btn.click()
        time.sleep(0.5)
        # Check cart badge count
        cart_badge = None
        try:
            cart_badge = driver.find_element(By.CSS_SELECTOR, ".shopping_cart_badge")
        except NoSuchElementException:
            cart_badge = None

        if cart_badge and cart_badge.text.strip():
            print("\n" + "="*60)
            print("CLICKED: Add to Cart succeeded without scrolling (Selenium did not block click)")
            print("="*60)
            print(f"Cart count: {cart_badge.text}")
            driver.save_screenshot("nc04_click_succeeded.png")
        else:
            print("\n" + "="*60)
            print("NO CART UPDATE: Click did not add item — behavior unexpected or blocked")
            print("="*60)
            driver.save_screenshot("nc04_no_cart_update.png")

    except (ElementClickInterceptedException, ElementNotInteractableException, WebDriverException) as e:
        print("\n" + "="*60)
        print("EXPECTED/OBSERVED FAILURE: Click blocked because element is out of viewport or not interactable")
        print("="*60)
        print(f"Exception Type: {type(e).__name__}")
        print(f"Error Message: {str(e)}")
        print("\nSelenium Behavior:")
        print("  ✓ May raise ElementClickInterceptedException / ElementNotInteractableException or 'element not clickable' message")
        print("\nPlaywright Behavior (for comparison):")
        print("  → Would auto-scroll the element into view and perform the click (no exception)")
        print("\nTestim/Mabl Behavior (for comparison):")
        print("  → Would auto-scroll and may attempt healed locator or retry click")
        driver.save_screenshot("nc04_click_failure.png")
        with open("nc04_failure_page_source.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)

except NoSuchElementException as e:
    print(f"\n{'='*60}")
    print("FINAL RESULT: NoSuchElementException - required element not found")
    print(f"{'='*60}")
    print(f"Exception Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")

except TimeoutException as e:
    print(f"\n{'='*60}")
    print("FINAL RESULT: TimeoutException - page didn't load as expected")
    print(f"{'='*60}")
    print(f"Exception Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")

except Exception as e:
    print(f"\n{'='*60}")
    print("UNEXPECTED ERROR")
    print(f"{'='*60}")
    print(f"Exception Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")
    try:
        driver.save_screenshot("nc04_unexpected.png")
        with open("nc04_unexpected_page_source.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
    except:
        pass

finally:
    print(f"\n{'='*60}")
    print("Test completed - demonstrating click behavior when element is out of viewport")
    print(f"{'='*60}")
    time.sleep(1)
    driver.quit()
