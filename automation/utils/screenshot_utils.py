import os
import datetime
import logging
from selenium.webdriver.remote.webdriver import WebDriver
from automation.config.config import Config

logger = logging.getLogger("ScreenshotUtils")

class ScreenshotUtils:
    """Utility for capturing screenshots and browser logs on test failure."""

    @staticmethod
    def capture_screenshot(driver: WebDriver, test_name: str) -> str:
        """Capture screenshot and return absolute path."""
        try:
            os.makedirs(Config.SCREENSHOT_DIR, exist_ok=True)
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{test_name}_{timestamp}.png"
            filepath = os.path.join(Config.SCREENSHOT_DIR, filename)

            driver.save_screenshot(filepath)
            logger.info(f"Screenshot saved to: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Failed to capture screenshot for test '{test_name}': {e}")
            return ""

    @staticmethod
    def capture_browser_logs(driver: WebDriver, test_name: str) -> str:
        """Capture browser console logs."""
        try:
            os.makedirs(Config.LOG_DIR, exist_ok=True)
            logs = driver.get_log("browser")
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"browser_log_{test_name}_{timestamp}.txt"
            filepath = os.path.join(Config.LOG_DIR, filename)

            with open(filepath, "w", encoding="utf-8") as f:
                for entry in logs:
                    f.write(f"[{entry.get('timestamp')}] [{entry.get('level')}] {entry.get('message')}\n")

            logger.info(f"Browser console log saved to: {filepath}")
            return filepath
        except Exception as e:
            logger.warning(f"Could not capture browser log for {test_name}: {e}")
            return ""
