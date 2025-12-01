# Site: https://sandbox.moodledemo.net/
# Goal: Verify logout works (using correct demo credentials)

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# ---- Demo credentials (change role here if you want) ----
USERNAME = "teacher"      # or: admin / manager / student
PASSWORD = "sandbox24"

options = Options()
options.add_argument("--start-maximized")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
wait = WebDriverWait(driver, 15)

try:
    # Open MoodleSandbox home → click "Log in"
    driver.get("https://sandbox.moodledemo.net/")
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href*='/login/index.php']"))).click()

    # Fill username & password (per on-page hint)
    wait.until(EC.visibility_of_element_located((By.ID, "username"))).clear()
    driver.find_element(By.ID, "username").send_keys(USERNAME)
    driver.find_element(By.ID, "password").clear()
    driver.find_element(By.ID, "password").send_keys(PASSWORD)

    # Click "Log in"
    driver.find_element(By.ID, "loginbtn").click()

    # Verify we’re logged in (user menu becomes available)
    user_menu = wait.until(EC.visibility_of_element_located((
        By.CSS_SELECTOR, "#user-menu-toggle, button#user-menu-toggle, a#user-menu-toggle"
    )))
    print("Logged in as:", USERNAME)

    # Open user menu → click "Log out"
    user_menu.click()
    wait.until(EC.element_to_be_clickable((
        By.CSS_SELECTOR, "a[href*='login/logout.php'], a[href*='action=logout']"
    ))).click()

    # Confirm logged-out state (see "Log in" link or banner)
    wait.until(EC.any_of(
        EC.visibility_of_element_located((By.LINK_TEXT, "Log in")),
        EC.visibility_of_element_located((By.XPATH, "//*[contains(., 'You are not logged in.')]"))
    ))
    print("Logout successful on MoodleSandbox. Test Passed")

except Exception as e:
    driver.save_screenshot("moodle_logout_failure.png")
    print("Test Failed:", e)
finally:
    driver.quit()
