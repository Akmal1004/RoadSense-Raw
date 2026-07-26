"""Upload Page Object Model."""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class UploadPage(BasePage):
    """Page Object for File Upload tests."""

    FILE_INPUT = (By.CSS_SELECTOR, "input[type='file']")
    UPLOAD_BTN = (By.CSS_SELECTOR, "#upload-submit-btn, button.upload")

    def upload_file(self, file_path: str):
        if self.is_displayed(self.FILE_INPUT):
            self.driver.find_element(*self.FILE_INPUT).send_keys(file_path)
