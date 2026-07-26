from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from automation.config.config import Config

class WaitUtils:
    """Utility class providing explicit waits and element interaction helpers."""

    def __init__(self, driver: WebDriver, timeout: int = None):
        self.driver = driver
        self.timeout = timeout or Config.EXPLICIT_WAIT
        self.wait = WebDriverWait(self.driver, self.timeout)

    def wait_for_visibility(self, locator: tuple) -> WebElement:
        """Wait until an element is visible on the page."""
        return self.wait.until(EC.visibility_of_element_located(locator))

    def wait_for_clickable(self, locator: tuple) -> WebElement:
        """Wait until an element is clickable."""
        return self.wait.until(EC.element_to_be_clickable(locator))

    def wait_for_presence(self, locator: tuple) -> WebElement:
        """Wait until an element is present in DOM."""
        return self.wait.until(EC.presence_of_element_located(locator))

    def wait_for_text(self, locator: tuple, text: str) -> bool:
        """Wait until specified text is present in the element."""
        return self.wait.until(EC.text_to_be_present_in_element(locator, text))

    def wait_for_page_load(self):
        """Wait for document ready state to be complete."""
        self.wait.until(
            lambda driver: driver.execute_script("return document.readyState") == "complete"
        )
