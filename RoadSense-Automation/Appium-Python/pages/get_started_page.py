from appium.webdriver.common.appiumby import AppiumBy
from pages.base_page import BasePage

class GetStartedPage(BasePage):
    TAB_CREATE_ACCOUNT = (AppiumBy.XPATH, "//android.widget.TextView[@text='Create Account']")
    TAB_SIGN_IN = (AppiumBy.XPATH, "//android.widget.TextView[@text='Sign In']")
    TAB_RESET_CODE = (AppiumBy.XPATH, "//android.widget.TextView[@text='Reset Code']")

    INPUT_NAME = (AppiumBy.XPATH, "//android.widget.EditText[@hint='Full Name' or contains(@text, 'Alex')]")
    INPUT_EMAIL = (AppiumBy.XPATH, "//android.widget.EditText[@hint='Email Address' or contains(@text, 'email')]")
    INPUT_PASSWORD = (AppiumBy.XPATH, "//android.widget.EditText[@hint='Password' or @password='true']")
    INPUT_PHONE = (AppiumBy.XPATH, "//android.widget.EditText[@hint='Phone Number' or contains(@text, '98765')]")
    INPUT_VEHICLE = (AppiumBy.XPATH, "//android.widget.EditText[@hint='Vehicle Model' or contains(@text, 'Model')]")

    BTN_SUBMIT_SIGNUP = (AppiumBy.XPATH, "//android.widget.Button[contains(@text, 'Create Account') or contains(@text, 'Register')]")
    BTN_SUBMIT_LOGIN = (AppiumBy.XPATH, "//android.widget.Button[contains(@text, 'Sign In') or contains(@text, 'Login')]")
    BTN_SUBMIT_RESET = (AppiumBy.XPATH, "//android.widget.Button[contains(@text, 'Reset')]")

    TEXT_ERROR_MESSAGE = (AppiumBy.XPATH, "//android.widget.TextView[contains(@text, 'Error') or contains(@text, 'failed') or contains(@text, 'required')]")

    def register_user(self, name: str, email: str, password: str, phone: str = "+91 98765 43210", vehicle: str = "Tesla Model 3"):
        self.click(self.TAB_CREATE_ACCOUNT)
        self.send_keys(self.INPUT_NAME, name)
        self.send_keys(self.INPUT_EMAIL, email)
        self.send_keys(self.INPUT_PASSWORD, password)
        self.send_keys(self.INPUT_PHONE, phone)
        self.click(self.BTN_SUBMIT_SIGNUP)

    def login_user(self, email: str, password: str):
        self.click(self.TAB_SIGN_IN)
        self.send_keys(self.INPUT_EMAIL, email)
        self.send_keys(self.INPUT_PASSWORD, password)
        self.click(self.BTN_SUBMIT_LOGIN)

    def get_error_message(self) -> str:
        if self.is_displayed(self.TEXT_ERROR_MESSAGE):
            return self.get_text(self.TEXT_ERROR_MESSAGE)
        return ""
