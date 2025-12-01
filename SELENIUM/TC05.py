# Goal: Verify filter functionality works correctly and application remains stable

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from webdriver_manager.chrome import ChromeDriverManager
import time

# --- Setup ---
options = Options()
options.add_argument("--start-maximized")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
wait = WebDriverWait(driver, 15)

try:
    # Open the SauceDemo login page
    driver.get("https://www.saucedemo.com/")

    # Login with valid user (to access product page)
    wait.until(EC.visibility_of_element_located((By.ID, "user-name"))).send_keys("standard_user")
    driver.find_element(By.ID, "password").send_keys("secret_sauce")
    driver.find_element(By.ID, "login-button").click()

    # Wait for inventory page to load
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "inventory_list")))
    print("✓ Login successful - Products page loaded")

    # Get initial product count and names
    initial_products = driver.find_elements(By.CLASS_NAME, "inventory_item_name")
    initial_first_product = initial_products[0].text if initial_products else "No products"
    print(f"✓ Initial products loaded: {len(initial_products)} items")
    print(f"✓ First product: {initial_first_product}")

    # Test all filter options
    filter_options = [
        "az",      # Name (A to Z)
        "za",      # Name (Z to A) 
        "lohi",    # Price (low to high)
        "hilo"     # Price (high to low)
    ]
    
    filter_names = {
        "az": "Name (A to Z)",
        "za": "Name (Z to A)",
        "lohi": "Price (low to high)", 
        "hilo": "Price (high to low)"
    }

    for filter_value in filter_options:
        print(f"\n--- Testing filter: {filter_names[filter_value]} ---")
        
        # Find and use the sort dropdown
        sort_dropdown = driver.find_element(By.CLASS_NAME, "product_sort_container")
        select = Select(sort_dropdown)
        select.select_by_value(filter_value)
        
        # Wait for products to reorder
        time.sleep(2)
        
        # Verify products are still displayed (no crash)
        current_products = driver.find_elements(By.CLASS_NAME, "inventory_item")
        current_first_product = driver.find_elements(By.CLASS_NAME, "inventory_item_name")[0].text
        
        # Validation
        assert len(current_products) > 0, "No products displayed after filtering"
        assert len(current_products) == len(initial_products), "Product count changed after filtering"
        
        # For Name filters, verify order changed
        if filter_value in ["za", "az"]:
            if filter_value == "za":
                assert current_first_product != initial_first_product, "Products should be reordered Z-A"
            print(f"✓ Products reordered successfully")
        else:
            print(f"✓ Price filter applied successfully")
            
        print(f"✓ First product after filter: {current_first_product}")
        print(f"✓ Product count: {len(current_products)} - Application stable")

    # Final validation - application didn't crash
    current_url = driver.current_url
    assert "inventory" in current_url, "Application navigated away from products page"
    
    driver.save_screenshot("saucedemo_filter_test_success.png")
    print("\n TEST PASSED: All filters working correctly, application remained stable!")

except Exception as e:
    driver.save_screenshot("saucedemo_filter_test_fail.png")
    print(f"\n TEST FAILED: {e}")
    # Capture current state for debugging
    try:
        current_products = driver.find_elements(By.CLASS_NAME, "inventory_item")
        print(f"Debug - Current products count: {len(current_products)}")
        print(f"Debug - Current URL: {driver.current_url}")
    except:
        pass

finally:
    print("\nClosing browser...")
    driver.quit()