from appium import webdriver
from appium.options.android import UiAutomator2Options
from config.config import Config
from utils.logger import get_logger

logger = get_logger("DriverFactory")

class DriverFactory:
    @staticmethod
    def create_driver(device_type: str = "emulator"):
        logger.info(f"Initializing Appium driver for device: {device_type}")
        options = UiAutomator2Options()
        options.platform_name = Config.PLATFORM_NAME
        options.platform_version = Config.PLATFORM_VERSION
        options.device_name = Config.DEVICE_NAME
        options.automation_name = Config.AUTOMATION_NAME
        options.app_package = Config.APP_PACKAGE
        options.app_activity = Config.APP_ACTIVITY
        options.no_reset = False
        options.new_command_timeout = 300

        try:
            driver = webdriver.Remote(Config.APPIUM_SERVER_URL, options=options)
            driver.implicitly_wait(Config.IMPLICIT_WAIT)
            logger.info("Appium driver session initialized successfully.")
            return driver
        except Exception as e:
            logger.error(f"Failed to initialize Appium driver: {e}")
            raise e
