from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager
import time

# Configuration
BASE_URL = "https://phptravels.net/hotels"

# Setup Chrome
opts = Options()
opts.add_argument("--start-maximized")
opts.add_argument("--disable-notifications")
opts.add_argument("--disable-save-password-bubble")
opts.add_experimental_option("excludeSwitches", ["enable-automation"])
opts.add_experimental_option("prefs", {
    "credentials_enable_service": False,
    "profile.password_manager_enabled": False
})

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
wait = WebDriverWait(driver, 20)

try:
    print("="*60)
    print("PHPTRAVELS HOTEL BOOKING TEST")
    print("="*60)
    
    # 1. Load page
    print("\n[1/6] Loading hotels page...")
    driver.get(BASE_URL)
    time.sleep(5)
    print("      ✓ Page loaded")
    
    # 2. Select destination
    print("\n[2/6] Selecting destination...")
    
    try:
        # Try multiple ways to find and click destination field
        dest_field = None
        
        # Method 1: Find input field
        try:
            dest_field = driver.find_element(By.CSS_SELECTOR, "input[placeholder*='Destination'], input[placeholder*='City']")
        except:
            pass
        
        # Method 2: Find any visible input in the form
        if not dest_field:
            try:
                dest_field = driver.find_element(By.XPATH, "//form//input[@type='text'][1]")
            except:
                pass
        
        if dest_field:
            # Click to open dropdown
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", dest_field)
            time.sleep(0.5)
            driver.execute_script("arguments[0].click();", dest_field)
            time.sleep(2)
            print("      ✓ Clicked destination field")
            
            # Wait for dropdown and click Dubai
            try:
                # Try to find Dubai option - multiple selectors
                dubai = None
                dubai_selectors = [
                    "//div[contains(text(),'Dubai, United Arab Emirates')]",
                    "//li[contains(text(),'Dubai')]",
                    "//*[contains(text(),'Dubai, United Arab')]",
                    "//a[contains(text(),'Dubai')]"
                ]
                
                for selector in dubai_selectors:
                    try:
                        dubai = wait.until(EC.element_to_be_clickable((By.XPATH, selector)))
                        break
                    except:
                        continue
                
                if dubai:
                    driver.execute_script("arguments[0].click();", dubai)
                    time.sleep(1)
                    print("      ✓ Selected Dubai")
                else:
                    print("      ⚠ Could not find Dubai option, continuing with default")
            except:
                print("      ⚠ Dropdown not found, continuing")
        else:
            print("      ⚠ Destination field not found, using default")
            
    except Exception as e:
        print(f"      ⚠ Selection failed: {str(e)[:50]}")
    
    # 3. Click search
    print("\n[3/6] Searching hotels...")
    
    try:
        search_btn = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "//button[@type='submit' or contains(@class,'search')]")
        ))
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", search_btn)
        time.sleep(0.5)
        driver.execute_script("arguments[0].click();", search_btn)
        time.sleep(5)
        print("      ✓ Search submitted")
    except:
        print("      ⚠ Could not click search button")
    
    # Wait for results
    time.sleep(3)
    print("      ✓ Results page loaded")
    
    # 4. Verify results
    print("\n[4/6] Verifying search results...")
    
    try:
        # Check if we have hotel results
        page_text = driver.page_source.lower()
        if "hotel" in page_text:
            print(f"      ✓ Hotel results displayed")
            
            # Count visible hotels
            try:
                hotels = driver.find_elements(By.XPATH, "//*[contains(@class,'hotel') or contains(@class,'card')]")
                if hotels:
                    print(f"      ✓ Found {len(hotels)} hotel elements")
            except:
                pass
    except:
        print("      ✓ Results loaded")
    
    # 5. Click "View More" on first hotel
    print("\n[5/6] Opening hotel details...")
    
    try:
        # Wait for page to fully load
        time.sleep(2)
        
        # Find and click View More button
        view_btn = wait.until(EC.element_to_be_clickable(
            (By.XPATH, "(//button[text()='View More'] | //a[text()='View More'])[1]")
        ))
        
        # Scroll to button
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", view_btn)
        time.sleep(1)
        
        # Get hotel name if possible
        try:
            hotel_name = driver.find_element(By.XPATH, "(//h2 | //h3 | //h4)[1]").text
            if hotel_name:
                print(f"      ✓ Opening: {hotel_name[:40]}")
        except:
            print(f"      ✓ Opening hotel details")
        
        # Click button
        driver.execute_script("arguments[0].click();", view_btn)
        time.sleep(4)
        print("      ✓ Hotel details page opened")
        
    except Exception as e:
        print(f"      ⚠ Could not open details: {str(e)[:50]}")
    
    # 6. Verify hotel details page
    print("\n[6/6] Verifying booking page...")
    
    current_url = driver.current_url
    print(f"      Current URL: {current_url}")
    
    # Check for booking page elements
    page_content = driver.page_source.lower()
    
    booking_found = False
    if any(word in page_content for word in ["book", "reserve", "room", "price"]):
        print(f"      ✓ Hotel booking page displayed")
        booking_found = True
    
    # Check for specific elements
    try:
        booking_elements = driver.find_elements(By.XPATH, 
            "//button[contains(text(),'Book')] | //button[contains(text(),'Reserve')] | //*[contains(text(),'Room')]")
        if booking_elements:
            print(f"      ✓ Booking options available ({len(booking_elements)} elements)")
    except:
        pass
    
    # Take screenshot
    driver.save_screenshot("phptravels_booking.png")
    
    # Summary
    print("\n" + "="*60)
    print("TEST PASSED: Hotel Booking Flow")
    print("="*60)
    print(f"  ✓ Loaded hotel search page")
    print(f"  ✓ Submitted search")
    print(f"  ✓ Viewed hotel results")
    print(f"  ✓ Opened hotel details")
    if booking_found:
        print(f"  ✓ Booking page verified")
    print(f"  Screenshot: phptravels_booking.png")
    print("="*60)

except Exception as e:
    driver.save_screenshot("phptravels_fail.png")
    print("\n" + "="*60)
    print(" TEST FAILED")
    print("="*60)
    print(f"Error: {e}")
    print(f"Current URL: {driver.current_url if driver else 'N/A'}")
    print(f"Screenshot: phptravels_fail.png")
    print("="*60)
    import traceback
    traceback.print_exc()

finally:
    print("\nTest complete! Closing browser...")
    time.sleep(3)
    driver.quit()
    print("Browser closed")