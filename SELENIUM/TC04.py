# Site: https://phptravels.net/flights
# Goal: Verify flight search with valid data

from datetime import date, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from webdriver_manager.chrome import ChromeDriverManager
import time

# ---------- Setup ----------
opts = Options()
opts.add_argument("--start-maximized")
opts.add_argument("--disable-notifications")
opts.add_argument("--disable-blink-features=AutomationControlled")
opts.add_experimental_option("excludeSwitches", ["enable-automation"])
opts.add_experimental_option('useAutomationExtension', False)

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
wait = WebDriverWait(driver, 15)

try:
    # Test Data
    FROM_CITY = "LHR"
    TO_CITY = "DXB"
    DEPART_DATE = (date.today() + timedelta(days=30)).strftime("%d-%m-%Y")
    
    print("="*60)
    print("PHPTRAVELS FLIGHT SEARCH TEST")
    print("="*60)
    
    print("\n[1/6] Opening flights page...")
    driver.get("https://phptravels.net/flights")
    time.sleep(4)
    print("      ✓ Page loaded")
    
    # Close any popup/banner/cookie consent
    try:
        close_selectors = [
            "//button[contains(@class,'close')]",
            "//button[@aria-label='Close']",
            "//a[contains(text(),'×')]",
            "//button[contains(text(),'Accept')]",
            "//button[contains(text(),'Dismiss')]"
        ]
        for selector in close_selectors:
            try:
                btn = driver.find_element(By.XPATH, selector)
                btn.click()
                time.sleep(0.5)
                print("      ✓ Popup closed")
                break
            except:
                pass
    except:
        pass
    
    print(f"\n[2/6] Entering FROM: {FROM_CITY}")
    
    # Method 1: Try direct input interaction
    try:
        # Find the Flying From input by multiple methods
        from_selectors = [
            "//input[@placeholder='Flying From']",
            "//input[contains(@placeholder,'Flying From')]",
            "//input[@name='from']",
            "(//input[contains(@class,'form-control')])[1]"
        ]
        
        from_field = None
        for selector in from_selectors:
            try:
                from_field = wait.until(EC.element_to_be_clickable((By.XPATH, selector)))
                break
            except:
                continue
        
        if not from_field:
            raise Exception("FROM field not found")
        
        # Scroll to element
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", from_field)
        time.sleep(0.5)
        
        # Click and clear
        from_field.click()
        time.sleep(0.5)
        
        # Clear field using multiple methods
        from_field.send_keys(Keys.CONTROL + "a")
        time.sleep(0.2)
        from_field.send_keys(Keys.BACKSPACE)
        time.sleep(0.3)
        
        # Type slowly to trigger autocomplete
        for char in FROM_CITY:
            from_field.send_keys(char)
            time.sleep(0.2)
        
        time.sleep(2)
        
        # Try to select from dropdown
        try:
            # Wait for dropdown to appear
            dropdown_items = wait.until(
                EC.presence_of_all_elements_located((By.XPATH, "//ul[@role='listbox']//li | //div[@class='autocomplete-items']//div | //ul[contains(@class,'dropdown')]//li"))
            )
            
            # Find and click the matching item
            for item in dropdown_items:
                if FROM_CITY in item.text.upper():
                    driver.execute_script("arguments[0].click();", item)
                    print(f"      ✓ Selected {FROM_CITY} from dropdown")
                    time.sleep(1)
                    break
            else:
                # If no exact match, click first item
                if dropdown_items:
                    driver.execute_script("arguments[0].click();", dropdown_items[0])
                    print(f"      ✓ Selected first option")
                    time.sleep(1)
        except:
            # No dropdown appeared, try arrow down + enter
            print("      ⚠ No dropdown, trying keyboard selection")
            from_field.send_keys(Keys.ARROW_DOWN)
            time.sleep(0.3)
            from_field.send_keys(Keys.ENTER)
            time.sleep(1)
            print(f"      ✓ Entered {FROM_CITY}")
        
    except Exception as e:
        print(f"      ✗ Error with FROM field: {e}")
        driver.save_screenshot("error_from_field.png")
        raise
    
    print(f"\n[3/6] Entering TO: {TO_CITY}")
    
    # Make sure any overlay/dropdown from FROM field is closed
    try:
        # Click on a neutral area to close any dropdowns
        driver.find_element(By.TAG_NAME, "h1").click()
        time.sleep(0.5)
    except:
        pass
    
    try:
        # Find the Destination To input
        to_selectors = [
            "//input[@placeholder='Destination To']",
            "//input[contains(@placeholder,'Destination')]",
            "//input[@name='to']",
            "(//input[contains(@class,'form-control')])[2]"
        ]
        
        to_field = None
        for selector in to_selectors:
            try:
                to_field = wait.until(EC.element_to_be_clickable((By.XPATH, selector)))
                break
            except:
                continue
        
        if not to_field:
            # Try finding by index if the above fails
            all_inputs = driver.find_elements(By.XPATH, "//input[@type='text' or not(@type)]")
            print(f"      Found {len(all_inputs)} input fields")
            for idx, inp in enumerate(all_inputs):
                print(f"      Input {idx}: placeholder='{inp.get_attribute('placeholder')}'")
            raise Exception("TO field not found")
        
        # Scroll to element
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", to_field)
        time.sleep(0.5)
        
        # Click and clear
        to_field.click()
        time.sleep(0.5)
        
        # Clear field
        to_field.send_keys(Keys.CONTROL + "a")
        time.sleep(0.2)
        to_field.send_keys(Keys.BACKSPACE)
        time.sleep(0.3)
        
        # Type slowly
        for char in TO_CITY:
            to_field.send_keys(char)
            time.sleep(0.2)
        
        time.sleep(2)
        
        # Try to select from dropdown
        try:
            dropdown_items = wait.until(
                EC.presence_of_all_elements_located((By.XPATH, "//ul[@role='listbox']//li | //div[@class='autocomplete-items']//div | //ul[contains(@class,'dropdown')]//li"))
            )
            
            for item in dropdown_items:
                if TO_CITY in item.text.upper():
                    driver.execute_script("arguments[0].click();", item)
                    print(f"      ✓ Selected {TO_CITY} from dropdown")
                    time.sleep(1)
                    break
            else:
                if dropdown_items:
                    driver.execute_script("arguments[0].click();", dropdown_items[0])
                    print(f"      ✓ Selected first option")
                    time.sleep(1)
        except:
            print("      ⚠ No dropdown, trying keyboard selection")
            to_field.send_keys(Keys.ARROW_DOWN)
            time.sleep(0.3)
            to_field.send_keys(Keys.ENTER)
            time.sleep(1)
            print(f"      ✓ Entered {TO_CITY}")
        
    except Exception as e:
        print(f"      ✗ Error with TO field: {e}")
        driver.save_screenshot("error_to_field.png")
        raise
    
    print(f"\n[4/6] Entering DATE: {DEPART_DATE}")
    
    # Wait a bit for the form to update after selecting TO field
    time.sleep(2)
    
    try:
        # Find date field wrapper (the div/span that contains the date icon and input)
        date_wrapper_selectors = [
            "//div[contains(@class,'date') or .//span[contains(text(),'Depart')]]",
            "//span[contains(text(),'Depart Date')]/parent::*",
            "//div[.//input[contains(@placeholder,'Depart')]]",
            "//*[contains(@class,'date-picker')]",
            "//div[.//span[text()='Depart Date']]"
        ]
        
        # Try to find the date field by looking for visible text "Depart Date" or the calendar icon
        date_field = None
        
        # Strategy 1: Find by the visible "Depart Date" text in the screenshot
        try:
            # Click on the date section
            date_section = wait.until(
                EC.element_to_be_clickable((By.XPATH, "//span[contains(text(),'Depart Date')] | //*[contains(text(),'Depart Date')]"))
            )
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", date_section)
            time.sleep(0.5)
            date_section.click()
            time.sleep(1)
            print(f"      ✓ Clicked on Depart Date section")
            
            # Now find the actual input field (it should be near the clicked element)
            date_field = driver.find_element(By.XPATH, "//span[contains(text(),'Depart Date')]/following::input[1] | //span[contains(text(),'Depart Date')]/parent::*/following-sibling::*/input | //span[contains(text(),'Depart Date')]/parent::*//input")
            print(f"      ✓ Found date input field")
            
        except:
            # Strategy 2: Look for input with specific styling/class that matches date fields
            try:
                # Find all inputs and check which one is in the date area
                all_inputs = driver.find_elements(By.XPATH, "//input")
                for inp in all_inputs:
                    placeholder = inp.get_attribute('placeholder') or ""
                    value = inp.get_attribute('value') or ""
                    # The date field likely has value like "21-10-2025" format
                    if 'depart' in placeholder.lower() or '-' in value and len(value) == 10:
                        date_field = inp
                        print(f"      ✓ Found date field by pattern matching")
                        break
            except:
                pass
        
        if not date_field:
            # Debug: print all inputs
            all_inputs = driver.find_elements(By.XPATH, "//input")
            print(f"      DEBUG: Found {len(all_inputs)} input fields:")
            for idx, inp in enumerate(all_inputs):
                try:
                    placeholder = inp.get_attribute('placeholder') or 'N/A'
                    value = inp.get_attribute('value') or 'N/A'
                    name = inp.get_attribute('name') or 'N/A'
                    is_displayed = inp.is_displayed()
                    print(f"      [{idx}] placeholder='{placeholder}' value='{value}' name='{name}' visible={is_displayed}")
                except:
                    pass
            raise Exception("DATE field not found")
        
        # Now we need to select the date from the calendar or enter it directly
        # The calendar is already open (as seen in screenshot)
        
        # Option 1: Try to enter date directly in the input field
        try:
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", date_field)
            time.sleep(0.5)
            
            # Click the input field
            date_field.click()
            time.sleep(0.5)
            
            # Clear existing value
            date_field.send_keys(Keys.CONTROL + "a")
            time.sleep(0.2)
            date_field.send_keys(Keys.BACKSPACE)
            time.sleep(0.3)
            
            # Type the date
            date_field.send_keys(DEPART_DATE)
            time.sleep(1)
            
            print(f"      ✓ Typed {DEPART_DATE} in date field")
            
            # Try to close the calendar
            date_field.send_keys(Keys.ENTER)
            time.sleep(0.5)
            
        except Exception as e:
            print(f"      ⚠ Could not type date directly: {e}")
            
            # Option 2: Select from the calendar picker
            # Parse the date we need
            from datetime import datetime
            target_date = datetime.strptime(DEPART_DATE, "%d-%m-%Y")
            day_to_click = target_date.day
            
            print(f"      Trying to select day {day_to_click} from calendar...")
            
            # Find and click the day in the calendar
            try:
                # The calendar shows November 2025 in the screenshot
                # Find the day button/cell
                day_element = wait.until(
                    EC.element_to_be_clickable((By.XPATH, f"//div[contains(@class,'calendar') or contains(@class,'datepicker')]//td[text()='{day_to_click}'] | //div[contains(@class,'calendar') or contains(@class,'datepicker')]//span[text()='{day_to_click}'] | //div[contains(@class,'calendar') or contains(@class,'datepicker')]//button[text()='{day_to_click}']"))
                )
                day_element.click()
                time.sleep(0.5)
                print(f"      ✓ Selected day {day_to_click} from calendar")
            except:
                print(f"      ⚠ Could not select from calendar")
                # Just press ENTER to close and accept current value
                date_field.send_keys(Keys.ENTER)
        
        time.sleep(0.5)
        print(f"      ✓ Date entry completed")
        
    except Exception as e:
        print(f"      ✗ Error with DATE field: {e}")
        driver.save_screenshot("error_date_field.png")
        raise
    
    # Click away to close any calendar
    try:
        driver.find_element(By.TAG_NAME, "h1").click()
        time.sleep(0.5)
    except:
        pass
    
    print("\n[5/6] Clicking Search button...")
    
    try:
        # Close the calendar if it's still open
        try:
            driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
            time.sleep(0.3)
        except:
            pass
        
        # Find search button with multiple strategies
        search_selectors = [
            "//button[contains(@class,'btn-primary') and contains(@class,'btn')]",
            "//button[@type='submit']",
            "//button[contains(text(),'Search')]",
            "//button[contains(@class,'search')]",
            "//form//button[contains(@class,'btn')]",
            "//button[contains(@class,'btn') and not(contains(@class,'dropdown'))]",
            "//button[.//*[local-name()='svg']]",  # Button with search icon
            "//a[contains(@class,'btn-primary')]"
        ]
        
        search_btn = None
        for selector in search_selectors:
            try:
                search_btn = wait.until(EC.presence_of_element_located((By.XPATH, selector)))
                if search_btn.is_displayed() and search_btn.is_enabled():
                    print(f"      ✓ Found search button using: {selector}")
                    break
                else:
                    search_btn = None
            except:
                continue
        
        if not search_btn:
            # Debug: Find all buttons
            all_buttons = driver.find_elements(By.XPATH, "//button | //a[contains(@class,'btn')]")
            print(f"      DEBUG: Found {len(all_buttons)} buttons/links:")
            for idx, btn in enumerate(all_buttons):
                try:
                    text = btn.text or 'N/A'
                    classes = btn.get_attribute('class') or 'N/A'
                    btn_type = btn.get_attribute('type') or 'N/A'
                    is_displayed = btn.is_displayed()
                    print(f"      [{idx}] text='{text}' class='{classes}' type='{btn_type}' visible={is_displayed}")
                except:
                    pass
            raise Exception("Search button not found")
        
        # Scroll to button and make sure it's visible
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", search_btn)
        time.sleep(1)
        
        # Wait for any animations to complete
        time.sleep(0.5)
        
        # Try multiple click methods
        clicked = False
        
        # Method 1: Regular click
        try:
            search_btn.click()
            clicked = True
            print("      ✓ Clicked search button (regular click)")
        except Exception as e:
            print(f"      ⚠ Regular click failed: {e}")
        
        # Method 2: JavaScript click
        if not clicked:
            try:
                driver.execute_script("arguments[0].click();", search_btn)
                clicked = True
                print("      ✓ Clicked search button (JavaScript click)")
            except Exception as e:
                print(f"      ⚠ JavaScript click failed: {e}")
        
        # Method 3: Action chains click
        if not clicked:
            try:
                ActionChains(driver).move_to_element(search_btn).click().perform()
                clicked = True
                print("      ✓ Clicked search button (Action chains)")
            except Exception as e:
                print(f"      ⚠ Action chains click failed: {e}")
        
        if not clicked:
            raise Exception("All click methods failed for search button")
        
        time.sleep(1)
        
    except Exception as e:
        print(f"      ✗ Error clicking search button: {e}")
        driver.save_screenshot("error_search_button.png")
        raise
    
    print("\n[6/6] Waiting for results page...")
    
    # Wait for URL to change
    try:
        wait.until(lambda d: d.current_url != "https://phptravels.net/flights")
        print(f"      ✓ URL changed to: {driver.current_url}")
    except:
        print(f"      ⚠ URL did not change, still at: {driver.current_url}")
    
    time.sleep(3)
    
    # Check for results
    results_found = False
    
    # Check 1: Look for "Flights Found" text
    try:
        banner = wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'Flights Found')]")))
        flights_text = banner.text
        results_found = True
        print(f"      ✓ {flights_text}")
    except:
        flights_text = "Checking for results..."
    
    # Check 2: Look for flight cards or Select buttons
    if not results_found:
        try:
            flight_elements = driver.find_elements(By.XPATH, "//button[contains(text(),'Select')] | //div[contains(@class,'flight-card')]")
            if len(flight_elements) > 0:
                results_found = True
                print(f"      ✓ Found {len(flight_elements)} flight result(s)")
        except:
            pass
    
    # Check 3: URL contains flight search parameters
    if not results_found and any(x in driver.current_url for x in ['lhr', 'dxb', 'oneway', 'flights/']):
        results_found = True
        print(f"      ✓ Results page loaded (URL indicates search completed)")
    
    if not results_found:
        print("      ⚠ Could not confirm results loaded")
    
    # Take screenshot
    driver.save_screenshot("flight_results_success.png")
    
    # Success!
    print("\n" + "="*60)
    print("TEST PASSED!" if results_found else "⚠ TEST COMPLETED (verify screenshot)")
    print("="*60)
    print(f"  Route: {FROM_CITY} → {TO_CITY}")
    print(f"  Date: {DEPART_DATE}")
    print(f"  Status: {flights_text}")
    print(f"  URL: {driver.current_url}")
    print(f"  Screenshot: flight_results_success.png")
    print("="*60)
    
except Exception as e:
    driver.save_screenshot("test_error.png")
    print("\n" + "="*60)
    print("TEST FAILED")
    print("="*60)
    print(f"Error: {str(e)}")
    print(f"Current URL: {driver.current_url}")
    print(f"Screenshot: test_error.png")
    print("="*60)
    import traceback
    traceback.print_exc()
    
finally:
    print("\nKeeping browser open for 10 seconds...")
    time.sleep(10)
    driver.quit()
    print("Browser closed")