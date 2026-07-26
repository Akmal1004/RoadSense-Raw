module.exports = {
  spec: ["tests/**/*.spec.js"],
  timeout: 30000,
  retries: 1,
  reporter: "mochawesome",
  "reporter-option": [
    "reportDir=reports/mochawesome",
    "reportFilename=selenium_report",
    "quiet=false",
    "html=true",
    "json=true",
    "overwrite=true"
  ],
  ui: "bdd"
};
