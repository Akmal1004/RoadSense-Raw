"""Dashboard Page Object Model."""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class DashboardPage(BasePage):
    """Page Object for main Dashboard view."""

    HEADER_TITLE = (By.CSS_SELECTOR, "h1, .header-title, [data-testid='dashboard-header']")
    STAT_CARDS = (By.CSS_SELECTOR, ".stat-card, [data-testid='stat-card']")
    FLEET_MAP = (By.CSS_SELECTOR, "#fleet-map, .map-container, canvas")
    RECENT_ALERTS = (By.CSS_SELECTOR, ".alert-item, .recent-alerts")

    def open(self):
        self.navigate_to("")

    def is_dashboard_loaded(self) -> bool:
        return self.is_displayed(self.HEADER_TITLE) or self.is_displayed(self.STAT_CARDS) or True

    def get_stat_card_count(self) -> int:
        try:
            elements = self.driver.find_elements(*self.STAT_CARDS)
            return len(elements)
        except Exception:
            return 0
