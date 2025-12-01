# test_parabank_fund_transfer_valid_indexsafe.py
# Robust: works with 1+ accounts, selects by index, prints available options.

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time

BASE_URL = "https://parabank.parasoft.com/parabank/index.htm"  # change if you use another host
USERNAME = "john"
PASSWORD = "demo"
AMOUNT   = "25"

def vis(drv, locator, t=20):
    return WebDriverWait(drv, t).until(EC.visibility_of_element_located(locator))

def click(drv, locator, t=20):
    WebDriverWait(drv, t).until(EC.element_to_be_clickable(locator)).click()

def wait_for_options(select_el, min_count=1, timeout=15):
    """Wait until a <select> has at least min_count <option> elements."""
    end = time.time() + timeout
    while time.time() < end:
        options = select_el.find_elements(By.TAG_NAME, "option")
        if len(options) >= min_count:
            return options
        time.sleep(0.2)
    return select_el.find_elements(By.TAG_NAME, "option")

opts = Options()
opts.add_argument("--start-maximized")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
wait = WebDriverWait(driver, 25)

try:
    # 1) Login
    driver.get(BASE_URL)
    vis(driver, (By.NAME, "username")).send_keys(USERNAME)
    driver.find_element(By.NAME, "password").send_keys(PASSWORD)
    driver.find_element(By.CSS_SELECTOR, "input.button[value='Log In']").click()
    vis(driver, (By.LINK_TEXT, "Accounts Overview"))

    # 2) Transfer Funds
    click(driver, (By.LINK_TEXT, "Transfer Funds"))
    vis(driver, (By.XPATH, "//h1[contains(.,'Transfer Funds')]"))

    # 3) Get dropdowns and ensure they have options
    from_sel_el = vis(driver, (By.ID, "fromAccountId"))
    to_sel_el   = vis(driver, (By.ID, "toAccountId"))

    from_options = wait_for_options(from_sel_el, min_count=1, timeout=15)
    to_options   = wait_for_options(to_sel_el,   min_count=1, timeout=15)

    # Debug prints (also show in your terminal)
    print("From options:", [o.text.strip() for o in from_options])
    print("To options:",   [o.text.strip() for o in to_options])

    # Guard: if either list is empty, fail with clear message
    if not from_options or not to_options:
        raise RuntimeError("Dropdown has no options: "
                           f"from={len(from_options)} to={len(to_options)}")

    from_select = Select(from_sel_el)
    to_select   = Select(to_sel_el)

    # Always select index 0 for 'from'
    from_index = 0

    # Prefer a different 'to' if available; otherwise use index 0 (same account is allowed)
    to_index = 1 if len(to_options) > 1 else 0

    from_select.select_by_index(from_index)
    to_select.select_by_index(to_index)

    # 4) Amount + submit
    amt = vis(driver, (By.ID, "amount"))
    amt.clear()
    amt.send_keys(AMOUNT)
    click(driver, (By.CSS_SELECTOR, "input.button[value='Transfer']"))

    # 5) Verify confirmation
    heading = vis(driver, (By.XPATH, "//*[normalize-space()='Transfer Complete!' or normalize-space()='Transfer Complete']"))
    assert heading.is_displayed(), "Confirmation heading not visible."

    detail = vis(driver, (By.XPATH, "//*[contains(., 'has been transferred') and contains(., '$')]")).text
    assert AMOUNT in detail.replace(",", ""), f"Expected amount ${AMOUNT} in detail: {detail}"

    driver.save_screenshot("parabank_transfer_complete_indexsafe.png")
    print("Test Passed: Transfer Complete. Detail:", detail)

except Exception as e:
    driver.save_screenshot("parabank_transfer_error_indexsafe.png")
    # Dump a bit of context to help diagnose if it ever fails again
    try:
        print("Current URL:", driver.current_url)
    except Exception:
        pass
    print("Test Failed:", repr(e))
finally:
    driver.quit()
