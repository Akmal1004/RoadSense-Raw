from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from config.config import Config
from utils.logger import get_logger

logger = get_logger("BasePage")

class BasePage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, Config.EXPLICIT_WAIT)

    def find_element(self, locator: tuple):
        logger.debug(f"Locating element: {locator}")
        return self.wait.until(EC.presence_of_element_located(locator))

    def find_visible_element(self, locator: tuple):
        logger.debug(f"Waiting for visible element: {locator}")
        return self.wait.until(EC.visibility_of_element_located(locator))

    def click(self, locator: tuple):
        logger.info(f"Clicking element: {locator}")
        element = self.wait.until(EC.element_to_be_clickable(locator))
        element.click()

    def send_keys(self, locator: tuple, text: str):
        logger.info(f"Sending keys '{text}' to element: {locator}")
        element = self.find_element(locator)
        element.clear()
        element.send_keys(text)

    def get_text(self, locator: tuple) -> str:
        text = self.find_element(locator).text
        logger.debug(f"Retrieved text '{text}' from {locator}")
        return text

    def is_displayed(self, locator: tuple) -> bool:
        try:
            return self.find_element(locator).is_displayed()
        except Exception:
            return False

    def scroll_to_element(self, locator: tuple):
        logger.info(f"Scrolling to element: {locator}")
        self.driver.execute_script("mobile: scroll", {"direction": "down"})
