"""CRUD Page Object Model."""

from selenium.webdriver.common.by import By
from automation.pages.base_page import BasePage

class CRUDPage(BasePage):
    """Page Object for CRUD tables and data management."""

    DATA_TABLE = (By.CSS_SELECTOR, "table, .data-grid, [role='grid']")
    SEARCH_INPUT = (By.CSS_SELECTOR, "input[type='search'], #search-table")
    ADD_ROW_BTN = (By.CSS_SELECTOR, "#add-record-btn, .btn-add")

    def search_table(self, query: str):
        if self.is_displayed(self.SEARCH_INPUT):
            self.type_text(self.SEARCH_INPUT, query)
