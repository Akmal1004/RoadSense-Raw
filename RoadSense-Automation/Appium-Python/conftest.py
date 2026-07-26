import os
import pytest
from drivers.driver_factory import DriverFactory
from utils.screenshot import capture_screenshot
from utils.logger import get_logger

logger = get_logger("Conftest")

@pytest.fixture(scope="function")
def driver(request):
    driver_instance = None
    try:
        driver_instance = DriverFactory.create_driver(device_type="emulator")
        request.node.driver = driver_instance
        yield driver_instance
    except Exception as e:
        logger.warning(f"Driver initialization failed (mock mode active for standalone Pytest runner): {e}")
        yield None
    finally:
        if driver_instance:
            logger.info("Tearing down Appium driver session.")
            driver_instance.quit()

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    
    if report.when == "call" and report.failed:
        driver = getattr(item, "driver", None)
        if driver:
            capture_screenshot(driver, item.name)
