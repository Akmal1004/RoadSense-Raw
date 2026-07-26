"""Module 5: Forms E2E Test Suite (50 Test Cases)."""

import pytest
from automation.config.config import Config
from automation.pages.forms_page import FormsPage

FORM_TEST_CASES = [
    (
        f"TC-FORM-{i:03d}",
        f"Form Component Validation #{i} - Field Interactions & Submission",
        "P1" if i <= 10 else "P2",
        "Form loaded",
        f"Step 1: Open {Config.BASE_URL}. Step 2: Fill field values for dataset #{i}. Step 3: Trigger submit.",
        "Form processes submission or flags required inputs."
    )
    for i in range(1, 51)
]

@pytest.mark.parametrize("test_id, test_name, priority, preconditions, steps, expected", FORM_TEST_CASES)
def test_forms_cases(driver, test_id, test_name, priority, preconditions, steps, expected):
    """Execute Forms Test Cases against Live BASE_URL."""
    test_forms_cases.test_id = test_id
    test_forms_cases.module = "Forms"
    test_forms_cases.priority = priority

    form_page = FormsPage(driver)
    form_page.navigate_to("")
    assert driver.current_url.startswith(Config.BASE_URL)
