import os
import logging
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options as ChromeOptions
from webdriver_manager.chrome import ChromeDriverManager
from automation.config.config import Config

logger = logging.getLogger("DriverFactory")

class DriverFactory:
    """Factory class to create and configure Selenium WebDriver instances."""

    @staticmethod
    def get_driver(browser_name: str = None, headless: bool = None) -> webdriver.Remote:
        """Create and initialize a configured WebDriver instance."""
        browser_name = browser_name or Config.BROWSER
        headless = Config.HEADLESS if headless is None else headless

        if browser_name == "chrome":
            options = ChromeOptions()
            if headless:
                options.add_argument("--headless=new")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1920,1080")
            options.add_argument("--disable-notifications")
            options.add_argument("--disable-popup-blocking")
            options.add_argument("--disable-extensions")
            options.add_argument("--ignore-certificate-errors")
            options.add_argument("--remote-allow-origins=*")
            
            # Additional headless optimizations
            options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 RoadSenseAutomation/1.0")

            try:
                service = ChromeService(ChromeDriverManager().install())
                driver = webdriver.Chrome(service=service, options=options)
            except Exception as e:
                logger.warning(f"ChromeDriverManager failed with error: {e}. Falling back to default system ChromeDriver.")
                driver = webdriver.Chrome(options=options)

            driver.set_page_load_timeout(Config.PAGE_LOAD_TIMEOUT)
            driver.implicitly_wait(Config.IMPLICIT_WAIT)
            driver.maximize_window()
            logger.info(f"Initialized Chrome Driver (Headless: {headless}) successfully.")
            return driver
        else:
            raise ValueError(f"Unsupported browser type: '{browser_name}'. Only 'chrome' is configured for CI runs.")
