require("dotenv").config();

module.exports = {
  baseUrl: process.env.BASE_URL || "http://localhost:8082",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:5000/api",
  browser: process.env.BROWSER || "chrome",
  headless: process.env.HEADLESS === "true",
  implicitWait: parseInt(process.env.IMPLICIT_WAIT || "10000", 10),
  explicitWait: parseInt(process.env.EXPLICIT_WAIT || "15000", 10)
};
