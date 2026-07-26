const log4js = require("log4js");
const path = require("path");

log4js.configure({
  appenders: {
    file: { type: "file", filename: path.join(__dirname, "../logs/selenium_execution.log") },
    console: { type: "console" }
  },
  categories: {
    default: { appenders: ["file", "console"], level: "info" }
  }
});

const logger = log4js.getLogger("RoadSenseSelenium");
module.exports = logger;
