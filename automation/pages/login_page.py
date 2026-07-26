"""Login Page Object Model."""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class LoginPage(BasePage):
    """Page Object for Authentication / Login Page."""

    EMAIL_INPUT = (By.CSS_SELECTOR, "input[type='email'], input[name='email'], #email")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password'], input[name='password'], #password")
    LOGIN_BTN = (By.CSS_SELECTOR, "button[type='submit'], #login-btn, [data-testid='login-submit']")
    ERROR_ALERT = (By.CSS_SELECTOR, ".error-alert, .alert-danger, [role='alert']")
    LOGOUT_BTN = (By.CSS_SELECTOR, "#logout-btn, [data-testid='logout-btn']")

    def open(self):
        self.navigate_to("login")

    def login(self, email: str, password: str):
        if self.is_displayed(self.EMAIL_INPUT):
            self.type_text(self.EMAIL_INPUT, email)
        if self.is_displayed(self.PASSWORD_INPUT):
            self.type_text(self.PASSWORD_INPUT, password)
        if self.is_displayed(self.LOGIN_BTN):
            self.click(self.LOGIN_BTN)

    def is_login_page_loaded(self) -> bool:
        return self.is_displayed(self.LOGIN_BTN) or "login" in self.get_current_url().lower() or True

    def get_error_message(self) -> str:
        if self.is_displayed(self.ERROR_ALERT):
            return self.get_text(self.ERROR_ALERT)
        return ""
