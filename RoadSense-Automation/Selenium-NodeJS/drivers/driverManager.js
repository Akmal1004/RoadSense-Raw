const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const firefox = require("selenium-webdriver/firefox");
const edge = require("selenium-webdriver/edge");
const config = require("../config/env.config");
const logger = require("../utils/logger");

class DriverManager {
  static async createDriver(browserName = config.browser, headless = config.headless) {
    logger.info(`Initializing Selenium WebDriver for browser: ${browserName} (Headless: ${headless})`);

    let builder = new Builder();

    if (browserName === "chrome") {
      let options = new chrome.Options();
      if (headless) options.addArguments("--headless=new");
      options.addArguments("--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage", "--window-size=1920,1080");
      builder = builder.forBrowser("chrome").setChromeOptions(options);
    } else if (browserName === "firefox") {
      let options = new firefox.Options();
      if (headless) options.addArguments("-headless");
      builder = builder.forBrowser("firefox").setFirefoxOptions(options);
    } else if (browserName === "edge") {
      let options = new edge.Options();
      if (headless) options.addArguments("--headless=new");
      builder = builder.forBrowser("MicrosoftEdge").setEdgeOptions(options);
    }

    try {
      const driver = await builder.build();
      await driver.manage().setTimeouts({ implicit: config.implicitWait });
      await driver.manage().window().maximize();
      logger.info("Selenium WebDriver created successfully.");
      return driver;
    } catch (error) {
      logger.error(`Failed to build Selenium WebDriver: ${error.message}`);
      throw error;
    }
  }
}

module.exports = DriverManager;
