const { By } = require("selenium-webdriver");
const BasePage = require("./basePage");

class HomePage extends BasePage {
  constructor(driver) {
    super(driver);
    this.inputSource = By.xpath("//input[@placeholder='Current Location']");
    this.inputDestination = By.xpath("//input[@placeholder='Search destination...']");
    this.btnPlanRoute = By.xpath("//button[contains(text(),'Plan Route')]");
    this.chipFuel = By.xpath("//div[contains(text(),'Fuel Stations')]");
    this.chipHospitals = By.xpath("//div[contains(text(),'Hospitals')]");
    this.chipRestaurants = By.xpath("//div[contains(text(),'Restaurants')]");
    this.navDashboard = By.xpath("//a[contains(@href,'dashboard')] | //div[contains(text(),'Dashboard')]");
    this.navProfile = By.xpath("//a[contains(@href,'profile')] | //div[contains(text(),'Profile')]");
  }

  async planRoute(destination, source = "Current Location") {
    await this.sendKeys(this.inputSource, source);
    await this.sendKeys(this.inputDestination, destination);
    await this.click(this.btnPlanRoute);
  }

  async navigateToTab(tab) {
    if (tab === "Profile") {
      await this.click(this.navProfile);
    } else {
      await this.click(this.navDashboard);
    }
  }
}

module.exports = HomePage;
