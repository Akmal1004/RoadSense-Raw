"""Base Page Object implementation for RoadSense Selenium Automation Framework."""

import logging
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from automation.config.config import Config

logger = logging.getLogger("BasePage")

class BasePage:
    """Base class for all Page Objects providing reusable browser interactions."""

    def __init__(self, driver: WebDriver):
        self.driver = driver
        self.timeout = Config.EXPLICIT_WAIT
        self.wait = WebDriverWait(self.driver, self.timeout)

    def navigate_to(self, endpoint: str = ""):
        """Navigate to relative endpoint on Config.BASE_URL."""
        url = Config.get_url(endpoint)
        logger.info(f"Navigating to: {url}")
        self.driver.get(url)
        self.wait_for_page_load()

    def wait_for_page_load(self):
        """Wait until page document state is complete."""
        try:
            self.wait.until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
        except Exception as e:
            logger.warning(f"Page load wait timed out: {e}")

    def find_element(self, locator: tuple) -> WebElement:
        """Find element with explicit visibility wait."""
        return self.wait.until(EC.visibility_of_element_located(locator))

    def click(self, locator: tuple):
        """Click an element once clickable."""
        element = self.wait.until(EC.element_to_be_clickable(locator))
        element.click()

    def type_text(self, locator: tuple, text: str):
        """Clear and type text into target input field."""
        element = self.find_element(locator)
        element.clear()
        element.send_keys(text)

    def get_text(self, locator: tuple) -> str:
        """Get visible text content of element."""
        return self.find_element(locator).text.strip()

    def is_displayed(self, locator: tuple) -> bool:
        """Check if element is currently displayed."""
        try:
            return self.find_element(locator).is_displayed()
        except Exception:
            return False

    def get_title(self) -> str:
        """Get page document title."""
        return self.driver.title

    def get_current_url(self) -> str:
        """Get active page URL."""
        return self.driver.current_url

    def execute_script(self, script: str, *args):
        """Execute custom JavaScript script."""
        return self.driver.execute_script(script, *args)
