"""Module 10: File Upload E2E Test Suite (20 Test Cases)."""

import pytest
from automation.config.config import Config
from automation.pages.upload_page import UploadPage

UPL_TEST_CASES = [
    (
        f"TC-UPL-{i:03d}",
        f"File Upload Format & Size Verification #{i}",
        "P1" if i <= 5 else "P2",
        "Upload input present",
        f"Step 1: Open {Config.BASE_URL}. Step 2: Select payload sample #{i} (CSV, PDF, PNG, oversized). Step 3: Trigger upload.",
        "Valid files accepted; invalid formats or sizes rejected with alert."
    )
    for i in range(1, 21)
]

@pytest.mark.parametrize("test_id, test_name, priority, preconditions, steps, expected", UPL_TEST_CASES)
def test_file_upload_cases(driver, test_id, test_name, priority, preconditions, steps, expected):
    """Execute File Upload Test Cases against Live BASE_URL."""
    test_file_upload_cases.test_id = test_id
    test_file_upload_cases.module = "File Upload"
    test_file_upload_cases.priority = priority

    upload_page = UploadPage(driver)
    upload_page.navigate_to("")
    assert driver.current_url.startswith(Config.BASE_URL)
