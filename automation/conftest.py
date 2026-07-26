"""Pytest Global Configuration, Hooks & Test Fixtures."""

import os
import json
import time
import pytest
from datetime import datetime
from automation.config.config import Config
from automation.drivers.driver_factory import DriverFactory
from automation.utils.screenshot_utils import ScreenshotUtils
from automation.utils.logger import logger
from automation.utils.excel_reporter import ExcelReporter
from automation.utils.html_reporter import HTMLReporter
from automation.utils.summary_generator import SummaryGenerator

# Global collector for test execution details
EXECUTED_RESULTS = []
SESSION_START_TIME = 0

def pytest_addoption(parser):
    """Add custom CLI arguments for pytest."""
    parser.addoption("--base-url", action="store", default=Config.BASE_URL, help="Target Base URL")
    parser.addoption("--headless", action="store", default="true", help="Run browser in headless mode")

def pytest_sessionstart(session):
    """Session initialization hook."""
    global SESSION_START_TIME
    SESSION_START_TIME = time.time()
    logger.info("====================================================")
    logger.info("STARTING SELENIUM E2E TEST SUITE EXECUTION")
    logger.info(f"Target BASE_URL: {Config.BASE_URL}")
    logger.info("====================================================")

@pytest.fixture(scope="function")
def driver(request):
    """Pytest fixture providing isolated WebDriver per test."""
    driver_instance = DriverFactory.get_driver()
    yield driver_instance
    
    # Teardown: capture screenshot if failed
    if hasattr(request.node, "rep_call") and request.node.rep_call.failed:
        test_name = request.node.name
        logger.error(f"Test '{test_name}' FAILED. Capturing failure screenshot & browser logs.")
        ScreenshotUtils.capture_screenshot(driver_instance, test_name)
        ScreenshotUtils.capture_browser_logs(driver_instance, test_name)
        
    try:
        driver_instance.quit()
    except Exception as e:
        logger.warning(f"Error closing driver session: {e}")

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Hook to capture test status and execution metadata."""
    outcome = yield
    rep = outcome.get_result()
    setattr(item, "rep_" + rep.when, rep)

    if rep.when == "call":
        test_id = getattr(item.function, "test_id", item.name)
        module = getattr(item.function, "module", "General")
        priority = getattr(item.function, "priority", "P2")
        duration = rep.duration
        status = "PASS" if rep.passed else ("FAIL" if rep.failed else "SKIPPED")
        error_msg = str(rep.longrepr.reprcrash.message) if (rep.failed and hasattr(rep.longrepr, "reprcrash")) else ""

        result_entry = {
            "test_id": test_id,
            "module": module,
            "test_name": item.name,
            "status": status,
            "duration": duration,
            "priority": priority,
            "error_message": error_msg,
            "timestamp": datetime.now().isoformat()
        }
        EXECUTED_RESULTS.append(result_entry)

def pytest_sessionfinish(session, exitstatus):
    """Session tear-down hook to compile metrics and trigger reporting."""
    global SESSION_START_TIME, EXECUTED_RESULTS
    total_duration = time.time() - SESSION_START_TIME

    total = len(EXECUTED_RESULTS)
    passed = sum(1 for r in EXECUTED_RESULTS if r["status"] == "PASS")
    failed = sum(1 for r in EXECUTED_RESULTS if r["status"] == "FAIL")
    skipped = sum(1 for r in EXECUTED_RESULTS if r["status"] in ["SKIPPED", "BLOCKED"])
    pass_rate = (passed / total * 100) if total > 0 else 100.0

    metrics = {
        "base_url": Config.BASE_URL,
        "total": total,
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
        "pass_rate": pass_rate,
        "total_duration": total_duration
    }

    logger.info("====================================================")
    logger.info(f"TEST EXECUTION COMPLETE: Total={total}, Passed={passed}, Failed={failed}, PassRate={pass_rate:.2f}%")
    logger.info("====================================================")

    # Save JSON results
    os.makedirs(Config.JSON_DIR, exist_ok=True)
    json_path = os.path.join(Config.JSON_DIR, "execution-results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"metrics": metrics, "results": EXECUTED_RESULTS}, f, indent=2)

    # Generate Reports
    try:
        ExcelReporter.generate_all_excel_reports(EXECUTED_RESULTS, metrics)
        HTMLReporter.generate_html_reports(EXECUTED_RESULTS, metrics)
        SummaryGenerator.generate_summary(EXECUTED_RESULTS, metrics)
    except Exception as e:
        logger.error(f"Error generating automation reports: {e}")

    # Enforce pass rate threshold if in CI
    if Config.IS_CI and pass_rate < Config.CRITICAL_PASS_THRESHOLD:
        logger.error(f"CI Pass Rate Threshold ({Config.CRITICAL_PASS_THRESHOLD}%) violated! Actual: {pass_rate:.2f}%")
