from appium.webdriver.common.appiumby import AppiumBy
from pages.base_page import BasePage

class HomePage(BasePage):
    INPUT_SOURCE = (AppiumBy.XPATH, "//android.widget.EditText[@hint='Current Location' or contains(@text, 'Location')]")
    INPUT_DESTINATION = (AppiumBy.XPATH, "//android.widget.EditText[@hint='Search destination...' or contains(@text, 'Search')]")
    BTN_PLAN_ROUTE = (AppiumBy.XPATH, "//android.widget.Button[contains(@text, 'Plan Route')]")

    CHIP_FUEL = (AppiumBy.XPATH, "//android.widget.TextView[@text='Fuel Stations']")
    CHIP_HOSPITALS = (AppiumBy.XPATH, "//android.widget.TextView[@text='Hospitals']")
    CHIP_RESTAURANTS = (AppiumBy.XPATH, "//android.widget.TextView[@text='Restaurants']")
    CHIP_EV = (AppiumBy.XPATH, "//android.widget.TextView[@text='EV Chargers']")

    TAB_HOME = (AppiumBy.XPATH, "//android.widget.TextView[@text='Home']")
    TAB_DASHBOARD = (AppiumBy.XPATH, "//android.widget.TextView[@text='Dashboard']")
    TAB_ROUTES = (AppiumBy.XPATH, "//android.widget.TextView[@text='Routes']")
    TAB_ASSISTANT = (AppiumBy.XPATH, "//android.widget.TextView[@text='Assistant']")
    TAB_PROFILE = (AppiumBy.XPATH, "//android.widget.TextView[@text='Profile']")

    def plan_trip(self, destination: str, source: str = "Current Location"):
        self.send_keys(self.INPUT_SOURCE, source)
        self.send_keys(self.INPUT_DESTINATION, destination)
        self.click(self.BTN_PLAN_ROUTE)

    def select_category_chip(self, category: str):
        if category == "Fuel Stations":
            self.click(self.CHIP_FUEL)
        elif category == "Hospitals":
            self.click(self.CHIP_HOSPITALS)
        elif category == "Restaurants":
            self.click(self.CHIP_RESTAURANTS)
        elif category == "EV Chargers":
            self.click(self.CHIP_EV)

    def navigate_to_tab(self, tab_name: str):
        if tab_name == "Dashboard":
            self.click(self.TAB_DASHBOARD)
        elif tab_name == "Routes":
            self.click(self.TAB_ROUTES)
        elif tab_name == "Assistant":
            self.click(self.TAB_ASSISTANT)
        elif tab_name == "Profile":
            self.click(self.TAB_PROFILE)
        else:
            self.click(self.TAB_HOME)
