from appium.webdriver.common.appiumby import AppiumBy
from pages.base_page import BasePage

class ProfilePage(BasePage):
    TEXT_USER_NAME = (AppiumBy.XPATH, "//android.widget.TextView[contains(@text, 'lokesh') or contains(@text, 'Morgan')]")
    TEXT_USER_EMAIL = (AppiumBy.XPATH, "//android.widget.TextView[contains(@text, '@')]")
    BTN_EDIT_PROFILE = (AppiumBy.XPATH, "//android.widget.Button[contains(@text, 'Edit Profile')]")
    BTN_LOGOUT = (AppiumBy.XPATH, "//android.widget.Button[contains(@text, 'Log Out')]")

    INPUT_EDIT_NAME = (AppiumBy.XPATH, "//android.widget.EditText[@hint='Full Name']")
    INPUT_EDIT_PHONE = (AppiumBy.XPATH, "//android.widget.EditText[@hint='Phone Number']")
    INPUT_EDIT_VEHICLE = (AppiumBy.XPATH, "//android.widget.EditText[@hint='Vehicle Model']")
    BTN_SAVE_PROFILE = (AppiumBy.XPATH, "//android.widget.Button[contains(@text, 'Save')]")

    def edit_profile(self, name: str, phone: str, vehicle: str):
        self.click(self.BTN_EDIT_PROFILE)
        self.send_keys(self.INPUT_EDIT_NAME, name)
        self.send_keys(self.INPUT_EDIT_PHONE, phone)
        self.send_keys(self.INPUT_EDIT_VEHICLE, vehicle)
        self.click(self.BTN_SAVE_PROFILE)

    def logout(self):
        self.click(self.BTN_LOGOUT)
