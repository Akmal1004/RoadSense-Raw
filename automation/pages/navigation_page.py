"""Navigation Page Object Model."""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class NavigationPage(BasePage):
    """Page Object for App Navigation Bar & Sidebar Menu."""

    NAV_LINKS = (By.CSS_SELECTOR, "nav a, .nav-item, [role='navigation'] a")

    def click_nav_item(self, item_name: str):
        links = self.driver.find_elements(*self.NAV_LINKS)
        for link in links:
            if item_name.lower() in link.text.lower():
                link.click()
                self.wait_for_page_load()
                return True
        return False
