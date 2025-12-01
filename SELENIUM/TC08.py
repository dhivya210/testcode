# test_moodle_view_participants.py
# Site: https://sandbox.moodledemo.net
# Goal: Enter a course, view participants, and find Max Manager

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time

BASE = "https://sandbox.moodledemo.net"
USERNAME = "admin"
PASSWORD = "sandbox24"
TARGET_USER = "Max Manager"

opts = Options()
opts.add_argument("--start-maximized")
opts.add_argument("--disable-notifications")
opts.add_experimental_option("excludeSwitches", ["enable-automation"])

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
wait = WebDriverWait(driver, 30)

try:
    print("="*60)
    print("MOODLE VIEW PARTICIPANTS TEST")
    print("="*60)
    
    # 1) Login
    print("\n[1/5] Logging in...")
    driver.get(f"{BASE}/login/index.php")
    time.sleep(2)
    
    username_field = wait.until(EC.visibility_of_element_located((By.ID, "username")))
    username_field.clear()
    username_field.send_keys(USERNAME)
    
    password_field = driver.find_element(By.ID, "password")
    password_field.clear()
    password_field.send_keys(PASSWORD)
    
    login_btn = wait.until(EC.element_to_be_clickable((By.ID, "loginbtn")))
    login_btn.click()
    time.sleep(3)
    print("      Login submitted")

    # Check for login errors
    try:
        alert = WebDriverWait(driver, 3).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "div[role='alert'], .alert"))
        )
        if "invalid" in alert.text.lower() or "incorrect" in alert.text.lower():
            raise AssertionError(f"Login failed: {alert.text.strip()}")
    except:
        pass

    # Wait for dashboard
    wait.until(lambda d: "login" not in d.current_url.lower())
    print(f"      Logged in successfully")
    time.sleep(2)

    # 2) Find and enter a course
    print("\n[2/5] Looking for a course to enter...")
    
    # Look for any available course on the dashboard
    course_link = None
    course_selectors = [
        (By.XPATH, "//a[contains(@href,'/course/view.php')]"),
        (By.XPATH, "//div[contains(@class,'course')]//a"),
        (By.XPATH, "//h3//a | //h4//a"),
        (By.CSS_SELECTOR, "a[href*='course/view']")
    ]
    
    for selector in course_selectors:
        try:
            courses = driver.find_elements(*selector)
            if courses:
                # Filter to find actual course links
                for course in courses:
                    href = course.get_attribute('href') or ''
                    text = course.text.strip()
                    if 'course/view.php' in href and text and len(text) > 3:
                        course_link = course
                        print(f"      ✓ Found course: '{text}'")
                        break
                if course_link:
                    break
        except:
            continue
    
    if not course_link:
        # Try to navigate to site home / front page which has participants
        print("      No course found, trying Site home...")
        driver.get(f"{BASE}/")
        time.sleep(2)
        
        # Look for "Home" or site link
        try:
            home_link = driver.find_element(By.LINK_TEXT, "Home")
            home_link.click()
            time.sleep(2)
            print("      Clicked 'Home'")
        except:
            pass
    else:
        # Click on the course
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", course_link)
        time.sleep(0.5)
        course_link.click()
        time.sleep(3)
        print(f"      Entered course")
    
    print(f"      Current URL: {driver.current_url}")

    # 3) Click on "Participants" tab
    print("\n[3/5] Looking for 'Participants' link...")
    
    # Wait a bit for page to load
    time.sleep(2)
    
    participants_link = None
    participants_selectors = [
        (By.LINK_TEXT, "Participants"),
        (By.PARTIAL_LINK_TEXT, "Participants"),
        (By.XPATH, "//a[normalize-space()='Participants']"),
        (By.XPATH, "//nav//a[contains(text(),'Participants')]"),
        (By.XPATH, "//a[contains(@href,'user/index.php')]")
    ]
    
    for selector in participants_selectors:
        try:
            participants_link = wait.until(EC.element_to_be_clickable(selector))
            print(f"       Found 'Participants' link")
            break
        except:
            continue
    
    if not participants_link:
        # Debug: show navigation links
        print("      DEBUG: Available navigation links:")
        nav_links = driver.find_elements(By.XPATH, "//nav//a | //ul[contains(@class,'nav')]//a")
        for idx, link in enumerate(nav_links[:15]):
            text = link.text.strip()
            if text:
                print(f"      [{idx}] {text}")
        
        driver.save_screenshot("debug_no_participants.png")
        raise Exception("Could not find 'Participants' link - may need to enter a course first")
    
    # Click Participants
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", participants_link)
    time.sleep(0.5)
    participants_link.click()
    time.sleep(3)
    print("      Clicked 'Participants'")
    print(f"      Current URL: {driver.current_url}")

    # 4) Wait for participants list
    print("\n[4/5] Waiting for participants list to load...")
    
    # Check for error messages first
    try:
        error = driver.find_element(By.XPATH, "//*[contains(text(),'Can') and contains(text(),'find')]")
        print(f"      Error found: {error.text}")
        driver.save_screenshot("error_found.png")
        raise Exception("Database error on participants page")
    except:
        pass  # No error, good
    
    # Wait for participants table or list
    participants_loaded = False
    load_indicators = [
        (By.XPATH, "//table[contains(@class,'generaltable')]"),
        (By.XPATH, "//*[contains(text(),'participants') or contains(text(),'users')]"),
        (By.XPATH, "//div[contains(@class,'userlist') or contains(@class,'participants')]")
    ]
    
    for selector in load_indicators:
        try:
            element = wait.until(EC.presence_of_element_located(selector))
            print(f"      Participants list loaded")
            participants_loaded = True
            break
        except:
            continue
    
    if not participants_loaded:
        print("      Could not confirm participants loaded")
        driver.save_screenshot("debug_participants_load.png")
    
    # Get count if available
    try:
        count_text = driver.find_element(By.XPATH, "//*[contains(text(),'participants') or contains(text(),'users found')]").text
        print(f"       {count_text}")
    except:
        pass
    
    time.sleep(2)

    # 5) Find Max Manager
    print(f"\n[5/5] Searching for '{TARGET_USER}'...")
    
    # Scroll to see more participants
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(1)
    driver.execute_script("window.scrollTo(0, 0);")
    time.sleep(1)
    
    # Search for Max Manager
    max_link = None
    max_selectors = [
        (By.LINK_TEXT, "Max Manager"),
        (By.PARTIAL_LINK_TEXT, "Max Manager"),
        (By.XPATH, "//a[contains(text(),'Max Manager')]"),
        (By.XPATH, "//a[contains(text(),'Max') and contains(text(),'Manager')]"),
        (By.XPATH, "//td[contains(text(),'Max')]/following-sibling::td//a | //td[contains(text(),'Max')]//a")
    ]
    
    for selector in max_selectors:
        try:
            max_link = driver.find_element(*selector)
            print(f"      Found '{TARGET_USER}'")
            break
        except:
            continue
    
    if not max_link:
        # Debug
        print("      DEBUG: Searching for user links...")
        user_links = driver.find_elements(By.XPATH, "//table//a | //div[contains(@class,'user')]//a")
        print(f"      Found {len(user_links)} links:")
        for idx, link in enumerate(user_links[:15]):
            text = link.text.strip()
            href = link.get_attribute('href') or ''
            if text and 'user' in href:
                print(f"      [{idx}] {text}")
        
        # Check if Max is on page at all
        if "Max" in driver.page_source:
            print("      'Max' text exists on page")
            try:
                max_elements = driver.find_elements(By.XPATH, "//*[contains(text(),'Max')]")
                for elem in max_elements[:5]:
                    print(f"        Found: {elem.text}")
            except:
                pass
        else:
            print("      'Max' text NOT on page")
        
        driver.save_screenshot("debug_max_not_found.png")
        print(f"       Could not find '{TARGET_USER}'")
    else:
        # Click on profile
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", max_link)
        time.sleep(0.5)
        max_link.click()
        time.sleep(3)
        print(f"       Clicked on '{TARGET_USER}' profile")
        
        # Verify profile loaded
        try:
            profile_elem = driver.find_element(By.XPATH, "//*[contains(text(),'Max Manager') or contains(text(),'User details')]")
            print(f"      Profile page loaded: {profile_elem.text[:50]}")
        except:
            print("       Could not verify profile page")
    
    # Final screenshot
    driver.save_screenshot("moodle_result.png")
    
    print("\n" + "="*60)
    if max_link:
        print(f"TEST PASSED: Found '{TARGET_USER}'")
    else:
        print(f" TEST PARTIAL: Reached participants but '{TARGET_USER}' not found")
    print("="*60)
    print(f"  Final URL: {driver.current_url}")
    print(f"  Screenshot: moodle_result.png")
    print("="*60)

except Exception as e:
    driver.save_screenshot("moodle_fail.png")
    print("\n" + "="*60)
    print("TEST FAILED")
    print("="*60)
    print(f"Error: {repr(e)}")
    print(f"Current URL: {driver.current_url}")
    print("Screenshot: moodle_fail.png")
    print("="*60)
    import traceback
    traceback.print_exc()

finally:
    print("\nKeeping browser open for 10 seconds...")
    time.sleep(10)
    driver.quit()
    print("Browser closed")