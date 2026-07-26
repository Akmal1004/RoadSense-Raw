"""Settings Page Object Model."""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class SettingsPage(BasePage):
    """Page Object for Application Settings view."""

    THEME_TOGGLE = (By.CSS_SELECTOR, "#theme-toggle, .theme-switch")
    SAVE_SETTINGS_BTN = (By.CSS_SELECTOR, "#save-settings-btn")

    def toggle_theme(self):
        if self.is_displayed(self.THEME_TOGGLE):
            self.click(self.THEME_TOGGLE)
