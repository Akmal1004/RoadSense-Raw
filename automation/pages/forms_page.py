"""Forms Page Object Model."""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class FormsPage(BasePage):
    """Page Object for Forms & Input operations."""

    SUBMIT_BTN = (By.CSS_SELECTOR, "button[type='submit'], #submit-form")
    SUCCESS_MSG = (By.CSS_SELECTOR, ".success-message, .alert-success")

    def submit_form(self):
        if self.is_displayed(self.SUBMIT_BTN):
            self.click(self.SUBMIT_BTN)
