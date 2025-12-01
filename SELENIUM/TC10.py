from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time

# Configuration
BASE_URL = "https://www.saucedemo.com"
USERNAME = "standard_user"
PASSWORD = "secret_sauce"
PRODUCT_NAME = "Sauce Labs Backpack"

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
wait = WebDriverWait(driver, 15)

try:
    print("="*60)
    print("SAUCEDEMO ADD TO CART TEST")
    print("="*60)
    
    # 1. Login
    print("\n[1/5] Logging in...")
    driver.get(BASE_URL)
    
    wait.until(EC.visibility_of_element_located((By.ID, "user-name"))).send_keys(USERNAME)
    driver.find_element(By.ID, "password").send_keys(PASSWORD)
    driver.find_element(By.ID, "login-button").click()
    
    wait.until(EC.url_contains("inventory.html"))
    print("      ✓ Login successful")
    
    # Dismiss any password save popups
    try:
        driver.execute_script("return document.querySelector('body').click();")
        time.sleep(0.5)
    except:
        pass
    
    # 2. Find product
    print(f"\n[2/5] Finding product: '{PRODUCT_NAME}'...")
    
    # Wait for inventory to load
    wait.until(EC.presence_of_element_located((By.CLASS_NAME, "inventory_list")))
    
    # Find product by data-test attribute (more reliable)
    add_to_cart_button = wait.until(EC.element_to_be_clickable(
        (By.ID, "add-to-cart-sauce-labs-backpack")
    ))
    print(f"      ✓ Found product")
    
    # Get price before adding to cart
    try:
        product_price = driver.find_element(By.XPATH, 
            "//div[text()='Sauce Labs Backpack']/ancestor::div[@class='inventory_item']//div[@class='inventory_item_price']"
        ).text
        print(f"      ✓ Price: {product_price}")
    except:
        product_price = "N/A"
    
    # 3. Add to cart
    print(f"\n[3/5] Adding to cart...")
    
    # Ensure button is visible and clickable
    wait.until(EC.element_to_be_clickable((By.ID, "add-to-cart-sauce-labs-backpack")))
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", add_to_cart_button)
    time.sleep(0.5)
    
    # Click using JavaScript as backup
    driver.execute_script("arguments[0].click();", add_to_cart_button)
    time.sleep(1)
    print(f"      ✓ Clicked add to cart button")
    
    # Verify button changed to Remove
    try:
        wait.until(EC.presence_of_element_located((By.ID, "remove-sauce-labs-backpack")))
        print(f"      ✓ Button changed to 'Remove'")
    except:
        print(f"      ⚠ Could not verify button change")
    
    # 4. Verify cart badge
    print(f"\n[4/5] Verifying cart badge...")
    
    cart_badge = wait.until(EC.visibility_of_element_located(
        (By.CSS_SELECTOR, "span.shopping_cart_badge")
    ))
    cart_count = cart_badge.text
    print(f"      ✓ Cart badge shows: {cart_count}")
    
    assert cart_count == "1", f"Expected cart count '1', got '{cart_count}'"
    
    # 5. Verify in cart
    print(f"\n[5/5] Opening cart and verifying...")
    
    # Click cart with multiple methods
    try:
        cart_link = wait.until(EC.element_to_be_clickable((By.CLASS_NAME, "shopping_cart_link")))
        driver.execute_script("arguments[0].click();", cart_link)
    except:
        # Fallback: click by CSS selector
        cart_link = driver.find_element(By.CSS_SELECTOR, "a.shopping_cart_link")
        cart_link.click()
    
    time.sleep(1)
    wait.until(EC.url_contains("cart.html"))
    print(f"      ✓ Navigated to cart")
    
    # Verify product in cart
    cart_product = wait.until(EC.visibility_of_element_located(
        (By.XPATH, f"//div[@class='inventory_item_name' and text()='{PRODUCT_NAME}']")
    ))
    print(f"      ✓ Product found in cart: '{cart_product.text}'")
    
    # Get cart item and verify details
    cart_item = cart_product.find_element(By.XPATH, "./ancestor::div[@class='cart_item']")
    
    cart_price = cart_item.find_element(By.CLASS_NAME, "inventory_item_price").text
    cart_qty = cart_item.find_element(By.CLASS_NAME, "cart_quantity").text
    
    print(f"      ✓ Price in cart: {cart_price}")
    print(f"      ✓ Quantity: {cart_qty}")
    
    if product_price != "N/A" and cart_price == product_price:
        print(f"      ✓ Price matches inventory")
    
    # Success screenshot
    driver.save_screenshot("saucedemo_success.png")
    
    # Summary
    print("\n" + "="*60)
    print("✅ TEST PASSED")
    print("="*60)
    print(f"  Product: {PRODUCT_NAME}")
    print(f"  Price: {cart_price}")
    print(f"  Quantity: {cart_qty}")
    print(f"  Screenshot: saucedemo_success.png")
    print("="*60)

except AssertionError as e:
    driver.save_screenshot("saucedemo_assertion_fail.png")
    print("\n" + "="*60)
    print("❌ ASSERTION FAILED")
    print("="*60)
    print(f"Error: {e}")
    print(f"Screenshot: saucedemo_assertion_fail.png")
    print("="*60)

except Exception as e:
    driver.save_screenshot("saucedemo_fail.png")
    print("\n" + "="*60)
    print("❌ TEST FAILED")
    print("="*60)
    print(f"Error: {e}")
    print(f"Current URL: {driver.current_url if driver else 'N/A'}")
    print(f"Screenshot: saucedemo_fail.png")
    print("="*60)

finally:
    print("\nTest complete! Closing browser...")
    time.sleep(2)  # Brief pause to see final state
    driver.quit()
    print("Browser closed")