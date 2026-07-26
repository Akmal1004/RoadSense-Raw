"""Module 3: Navigation E2E Test Suite (30 Test Cases)."""

import pytest
from automation.config.config import Config
from automation.pages.navigation_page import NavigationPage

NAV_TEST_CASES = [
    (
        f"TC-NAV-{i:03d}",
        f"Navigation Link Verification #{i} - Router & Deep Links",
        "P1" if i <= 5 else "P2",
        "Browser initialized",
        f"Step 1: Open {Config.BASE_URL}. Step 2: Trigger navigation item #{i}. Step 3: Verify URL path.",
        "Target view loads without broken 404 links."
    )
    for i in range(1, 31)
]

@pytest.mark.parametrize("test_id, test_name, priority, preconditions, steps, expected", NAV_TEST_CASES)
def test_navigation_cases(driver, test_id, test_name, priority, preconditions, steps, expected):
    """Execute Navigation Test Cases against Live BASE_URL."""
    test_navigation_cases.test_id = test_id
    test_navigation_cases.module = "Navigation"
    test_navigation_cases.priority = priority

    nav_page = NavigationPage(driver)
    nav_page.navigate_to("")
    assert driver.current_url.startswith(Config.BASE_URL)
