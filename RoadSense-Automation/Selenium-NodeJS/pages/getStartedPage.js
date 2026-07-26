const { By } = require("selenium-webdriver");
const BasePage = require("./basePage");

class GetStartedPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.tabCreateAccount = By.xpath("//div[contains(text(),'Create Account')]");
    this.tabSignIn = By.xpath("//div[contains(text(),'Sign In')]");
    this.inputName = By.xpath("//input[@placeholder='Full Name']");
    this.inputEmail = By.xpath("//input[@placeholder='Email Address']");
    this.inputPassword = By.xpath("//input[@placeholder='Password']");
    this.inputPhone = By.xpath("//input[@placeholder='Phone Number']");
    this.btnSubmit = By.xpath("//button[contains(text(),'Create Account') or contains(text(),'Sign In')]");
    this.textErrorMessage = By.xpath("//div[contains(@class,'error') or contains(text(),'Invalid')]");
  }

  async register(name, email, password, phone = "+91 98765 43210") {
    await this.click(this.tabCreateAccount);
    await this.sendKeys(this.inputName, name);
    await this.sendKeys(this.inputEmail, email);
    await this.sendKeys(this.inputPassword, password);
    await this.sendKeys(this.inputPhone, phone);
    await this.click(this.btnSubmit);
  }

  async login(email, password) {
    await this.click(this.tabSignIn);
    await this.sendKeys(this.inputEmail, email);
    await this.sendKeys(this.inputPassword, password);
    await this.click(this.btnSubmit);
  }

  async getErrorMessage() {
    if (await this.isDisplayed(this.textErrorMessage)) {
      return await this.getText(this.textErrorMessage);
    }
    return "";
  }
}

module.exports = GetStartedPage;
