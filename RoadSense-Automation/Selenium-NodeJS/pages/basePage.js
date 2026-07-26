const { until, By } = require("selenium-webdriver");
const config = require("../config/env.config");
const logger = require("../utils/logger");

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.timeout = config.explicitWait;
  }

  async navigateTo(url) {
    logger.info(`Navigating to URL: ${url}`);
    await this.driver.get(url);
  }

  async findElement(locator) {
    logger.debug(`Locating element by: ${JSON.stringify(locator)}`);
    return await this.driver.wait(until.elementLocated(locator), this.timeout);
  }

  async click(locator) {
    logger.info(`Clicking element: ${JSON.stringify(locator)}`);
    const element = await this.findElement(locator);
    await this.driver.wait(until.elementIsVisible(element), this.timeout);
    await element.click();
  }

  async sendKeys(locator, text) {
    logger.info(`Sending keys '${text}' to: ${JSON.stringify(locator)}`);
    const element = await this.findElement(locator);
    await element.clear();
    await element.sendKeys(text);
  }

  async getText(locator) {
    const element = await this.findElement(locator);
    const text = await element.getText();
    logger.debug(`Retrieved text '${text}' from: ${JSON.stringify(locator)}`);
    return text;
  }

  async isDisplayed(locator) {
    try {
      const element = await this.findElement(locator);
      return await element.isDisplayed();
    } catch (e) {
      return false;
    }
  }

  async getTitle() {
    return await this.driver.getTitle();
  }

  async getBrowserLogs() {
    try {
      return await this.driver.manage().logs().get("browser");
    } catch (e) {
      return [];
    }
  }
}

module.exports = BasePage;
