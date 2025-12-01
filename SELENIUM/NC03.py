# NC03 – Invalid Search Input
# Test: Handling of invalid input causing UI validation error (PHPTravels)
# Scenario: Attempt to search flights with empty destination and assert validation message

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
from pathlib import Path
import time
import os

options = Options()
options.add_argument("--start-maximized")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
wait = WebDriverWait(driver, 7)

print("="*60)
print("NC03 – Invalid Search Input")
print("Testing: PHPTravels flight search with empty destination → expect validation message")
print("="*60)

try:
    # Prefer local saved snapshot if it exists and is non-empty
    local_snap = Path(__file__).parent / "phptravels_results_source.html"
    if local_snap.exists() and local_snap.stat().st_size > 100:
        url = local_snap.resolve().as_uri()
        print(f"\n[1/4] Loading local snapshot: {url}")
    else:
        # Fallback to public demo site
        url = "https://www.phptravels.net"
        print(f"\n[1/4] Local snapshot not usable; opening public site: {url}")

    driver.get(url)
    time.sleep(2)
    print("      ✓ Page loaded")

    print("\n[2/4] Locating destination input (if present) — will leave it empty intentionally...")
    # Intentionally break here to demonstrate error handling: attempt to find a missing element
    # This will raise NoSuchElementException and be handled by the script's exception block
    driver.find_element(By.ID, "intentionally_missing_input")
    # Try several common attribute patterns for destination fields
    dest_inputs = driver.find_elements(By.XPATH,
        "//input[contains(translate(@placeholder,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'dest') or "
        "contains(translate(@placeholder,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'to') or "
        "contains(translate(@name,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'dest') or "
        "contains(translate(@id,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'dest')]")

    if dest_inputs:
        print(f"      ✓ Found destination-like input: tag={dest_inputs[0].tag_name}")
    else:
        print("      - No obvious destination input found; proceeding to click search to trigger validation")

    print("\n[3/4] Locating and clicking the Search button without filling destination...")
    # Broad search for a 'Search' button or input
    search_btn = None
    candidates = driver.find_elements(By.XPATH,
        "//button[contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'search') or "
        "contains(translate(@value,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'search') or "
        "contains(translate(@id,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'search')]")

    if candidates:
        search_btn = candidates[0]
    else:
        # try inputs of type submit
        submits = driver.find_elements(By.XPATH, "//input[@type='submit' or @type='button']")
        if submits:
            search_btn = submits[0]

    if not search_btn:
        raise NoSuchElementException("Search button not found on page — cannot perform test")

    try:
        search_btn.click()
    except WebDriverException:
        # fallback: attempt JavaScript click (some pages block Selenium click)
        driver.execute_script("arguments[0].click();", search_btn)

    print("      ✓ Click attempted — checking for validation message...")

    # Wait briefly for any validation / error message elements to appear
    validation_xpath = (
        "//*[contains(@class,'invalid') or contains(@class,'error') or @role='alert' or "
        "contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'required') or "
        "contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'please')]"
    )
    validation_element = None
    try:
        validation_element = WebDriverWait(driver, 3).until(
            EC.visibility_of_element_located((By.XPATH, validation_xpath))
        )
    except TimeoutException:
        validation_element = None

    if validation_element:
        print("\n" + "="*60)
        print("EXPECTED: Validation message detected")
        print("="*60)
        print(f"Message snippet: {validation_element.text.strip()[:200]}")
        driver.save_screenshot("nc03_validation_detected.png")
        with open("nc03_validation_page_source.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        print("      ✓ Saved screenshot and page source for debugging")
    else:
        # Assertion-based failure: validation message not found
        print("\n" + "="*60)
        print("FAILURE: No validation message found after submitting empty destination")
        print("="*60)
        driver.save_screenshot("nc03_no_validation.png")
        with open("nc03_no_validation_page_source.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        raise AssertionError("Validation message not detected — UI did not show input validation as expected")

except NoSuchElementException as e:
    print(f"\n{'='*60}")
    print("FINAL RESULT: NoSuchElementException")
    print(f"{'='*60}")
    print(f"Exception Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")

except AssertionError as e:
    print(f"\n{'='*60}")
    print("ASSERTION FAILURE — Validation element not found")
    print(f"{'='*60}")
    print(f"AssertionError: {str(e)}")

except Exception as e:
    print(f"\n{'='*60}")
    print("UNEXPECTED ERROR")
    print(f"{'='*60}")
    print(f"Exception Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")
    try:
        driver.save_screenshot("nc03_unexpected_error.png")
        with open("nc03_unexpected_page_source.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        print("      ✓ Saved artifacts")
    except:
        pass

finally:
    print(f"\n{'='*60}")
    print("Test completed - demonstrating invalid input validation handling")
    print(f"{'='*60}")
    time.sleep(1)
    driver.quit()
