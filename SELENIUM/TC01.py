from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time

options = Options()
options.add_argument("--start-maximized")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# ---Navigate to the login page---
driver.get("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login")

# ---Enter valid credentials---
time.sleep(2)
driver.find_element(By.NAME, "username").send_keys("Admin")
driver.find_element(By.NAME, "password").send_keys("admin123")

# ---Click the Login button---
driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

# --- Verify successful login ---
time.sleep(3)
expected_url = "https://opensource-demo.orangehrmlive.com/web/index.php/dashboard/index"
current_url = driver.current_url

if "dashboard" in current_url:
    print("Test Passed: Login successful and Dashboard page displayed.")
else:
    print("Test Failed: Login unsuccessful.")

 # ---Capture screenshot---
driver.save_screenshot("selenium_login_success.png")

# ---Close the browser---
driver.quit()
