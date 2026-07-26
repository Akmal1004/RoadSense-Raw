import os
import time
from utils.logger import get_logger

logger = get_logger("ScreenshotUtil")

def capture_screenshot(driver, test_name: str) -> str:
    try:
        screenshots_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "screenshots")
        os.makedirs(screenshots_dir, exist_ok=True)
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        filename = f"{test_name}_{timestamp}.png"
        filepath = os.path.join(screenshots_dir, filename)
        
        driver.save_screenshot(filepath)
        logger.info(f"Screenshot captured: {filepath}")
        return filepath
    except Exception as e:
        logger.error(f"Failed to capture screenshot for {test_name}: {e}")
        return ""
