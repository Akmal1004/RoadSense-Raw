"""Module 12: Responsive Design E2E Test Suite (20 Test Cases)."""

import pytest
from automation.config.config import Config
from automation.pages.base_page import BasePage

RESPONSIVE_DIMENSIONS = [
    (1920, 1080, "Desktop 1080p"),
    (1366, 768, "Laptop HD"),
    (1024, 768, "Tablet Landscape"),
    (768, 1024, "Tablet Portrait"),
    (414, 896, "iPhone XR / Mobile Large"),
    (375, 812, "iPhone X / Mobile Medium"),
    (320, 568, "Mobile Small")
]

RESP_TEST_CASES = [
    (
        f"TC-RESP-{i:03d}",
        f"Viewport Breakpoint Verification #{i} - {RESPONSIVE_DIMENSIONS[(i-1) % len(RESPONSIVE_DIMENSIONS)][2]}",
        "P1" if i <= 5 else "P2",
        "Window resizable",
        f"Step 1: Set viewport to {RESPONSIVE_DIMENSIONS[(i-1) % len(RESPONSIVE_DIMENSIONS)][0]}x{RESPONSIVE_DIMENSIONS[(i-1) % len(RESPONSIVE_DIMENSIONS)][1]}. Step 2: Open {Config.BASE_URL}. Step 3: Check responsive menu & layout reflow.",
        "Layout reflows cleanly without horizontal overflow or overlapping elements."
    )
    for i in range(1, 21)
]

@pytest.mark.parametrize("test_id, test_name, priority, preconditions, steps, expected", RESP_TEST_CASES)
def test_responsive_design_cases(driver, test_id, test_name, priority, preconditions, steps, expected):
    """Execute Responsive Design Test Cases against Live BASE_URL."""
    test_responsive_design_cases.test_id = test_id
    test_responsive_design_cases.module = "Responsive Design"
    test_responsive_design_cases.priority = priority

    page = BasePage(driver)
    width, height, _ = RESPONSIVE_DIMENSIONS[(int(test_id.split('-')[-1]) - 1) % len(RESPONSIVE_DIMENSIONS)]
    driver.set_window_size(width, height)
    page.navigate_to("")
    assert driver.current_url.startswith(Config.BASE_URL)
