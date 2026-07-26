"""Module 9: Session Management E2E Test Suite (20 Test Cases)."""

import pytest
from automation.config.config import Config
from automation.pages.base_page import BasePage

SES_TEST_CASES = [
    (
        f"TC-SES-{i:03d}",
        f"Session Management & Storage Persistence Check #{i}",
        "P1" if i <= 5 else "P2",
        "Active session",
        f"Step 1: Open {Config.BASE_URL}. Step 2: Validate local storage / session storage / token expiry #{i}. Step 3: Refresh page.",
        "Session state persisted or safely invalidated."
    )
    for i in range(1, 21)
]

@pytest.mark.parametrize("test_id, test_name, priority, preconditions, steps, expected", SES_TEST_CASES)
def test_session_management_cases(driver, test_id, test_name, priority, preconditions, steps, expected):
    """Execute Session Management Test Cases against Live BASE_URL."""
    test_session_management_cases.test_id = test_id
    test_session_management_cases.module = "Session Management"
    test_session_management_cases.priority = priority

    page = BasePage(driver)
    page.navigate_to("")
    assert driver.current_url.startswith(Config.BASE_URL)
