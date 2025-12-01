# Search with an invalid Employee Id → expect "No Records Found" (no crash)

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

INVALID_EMP_ID = "ZZZ999999999" 

def vis(drv, locator, t=20):
    return WebDriverWait(drv, t).until(EC.visibility_of_element_located(locator))

def clickable(drv, locator, t=20):
    return WebDriverWait(drv, t).until(EC.element_to_be_clickable(locator))

opts = Options()
opts.add_argument("--start-maximized")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=opts)
wait = WebDriverWait(driver, 25)

try:
    # Login
    driver.get("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login")
    vis(driver, (By.NAME, "username")).send_keys("Admin")
    driver.find_element(By.NAME, "password").send_keys("admin123")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    # Go to PIM → Employee List
    vis(driver, (By.XPATH, "//span[normalize-space()='PIM']")).click()
    vis(driver, (By.XPATH, "//h5[normalize-space()='Employee Information']"))

    # Reset any previous filters (important if the grid is sticky)
    try:
        clickable(driver, (By.XPATH, "//button[normalize-space()='Reset']"), t=5).click()
        WebDriverWait(driver, 5).until(EC.invisibility_of_element_located(
            (By.XPATH, "//div[contains(@class,'oxd-table-body')]//div[contains(@class,'oxd-table-card')]//span")
        ))
    except Exception:
        pass  # Reset not strictly required but helpful

    # Enter an invalid Employee Id (free-text field, not autocomplete)
    emp_id = vis(driver, (By.XPATH, "//label[normalize-space()='Employee Id']/following::input[1]"))
    emp_id.clear()
    emp_id.send_keys(INVALID_EMP_ID)

    # Click Search
    clickable(driver, (By.XPATH, "//button[normalize-space()='Search']")).click()

    # Verify "No Records Found" OR zero data rows
    # (OrangeHRM renders a single cell with that text when empty)
    no_records = None
    try:
        no_records = WebDriverWait(driver, 20).until(
            EC.visibility_of_element_located(
                (By.XPATH, "//div[contains(@class,'oxd-table')]//span[normalize-space()='No Records Found']")
            )
        )
    except Exception:
        pass

    # Fallback: assert 0 rows in table body
    rows = driver.find_elements(By.XPATH, "//div[contains(@class,'oxd-table-body')]/div[contains(@class,'oxd-table-card')]")

    driver.save_screenshot("orangehrm_employee_list_invalid_search_fixed.png")

    assert (no_records is not None) or (len(rows) == 0), "Expected 'No Records Found' or zero rows, but results were returned."
    print("Test Passed: 'No Records Found' displayed (or zero rows); app did not crash.")

except Exception as e:
    driver.save_screenshot("orangehrm_employee_list_invalid_search_fixed_fail.png")
    print("Test Failed:", repr(e))

finally:
    driver.quit()
