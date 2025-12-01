from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

opts = Options()
# comment the next line if you want to see the browser window
# opts.add_argument("--headless=new")

driver = webdriver.Chrome(options=opts)  # <- Selenium Manager handles the driver
driver.get("https://www.example.com")
print("Title is:", driver.title)
driver.quit()
