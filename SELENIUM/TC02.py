from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

def first_visible(driver, locators, timeout=10):
    """Return the first visible element among locator tuples."""
    wait = WebDriverWait(driver, timeout)
    for how, what in locators:
        try:
            el = wait.until(EC.visibility_of_element_located((how, what)))
            return el
        except Exception:
            continue
    return None

options = Options()
options.add_argument("--start-maximized")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
wait = WebDriverWait(driver, 15)

try:
    # ---Open ParaBank login page (TESTAR domain)---
    driver.get("https://para.testar.org/parabank/index.htm")

    # ---Enter invalid credentials---
    wait.until(EC.visibility_of_element_located((By.NAME, "username"))).send_keys("wronguser")
    driver.find_element(By.NAME, "password").send_keys("wrongpass")

    # ---Click Log In---
    driver.find_element(By.CSS_SELECTOR, "input.button[value='Log In']").click()

    # ---Verify error message (robust selectors + waits)---
    # Common error text:"The username and password could not be verified."
    error_locators = [
        (By.CSS_SELECTOR, "#rightPanel .error"),
        (By.XPATH, "//div[@id='rightPanel']//p[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), 'could not be verified')]"),
        (By.XPATH, "//div[@id='rightPanel']//p[contains(., 'The username and password could not be verified')]"),
        (By.XPATH, "//div[@id='rightPanel']//*[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), 'invalid')]"),
        (By.XPATH, "//div[@id='rightPanel']//p[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), 'error')]"),
    ]
    error_el = first_visible(driver, error_locators, timeout=12)

    # screenshot
    driver.save_screenshot("parabank_invalid_login.png")

    if error_el:
        text = error_el.text.strip()
        print(f"Test Passed: Error message displayed → '{text}'")
    else:
        # Helpful diagnostics
        print("Test Failed: Could not locate the error message element.")
        print("Current URL:", driver.current_url)
        # Save page source for quick inspection
        with open("parabank_invalid_login_source.html", "w", encoding="utf-8") as f:
            f.write(driver.page_source)
finally:
    driver.quit()
