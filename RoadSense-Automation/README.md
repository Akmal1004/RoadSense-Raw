# 🚀 RoadSense-Automation: Enterprise QA Automation Framework

An enterprise-grade hybrid QA test automation repository built for **RoadSense** featuring **300+ executable automated test cases** across mobile (Appium + Python) and web (Selenium + Node.js) platforms.

---

## 📁 Repository Structure

```
RoadSense-Automation/
├── Appium-Python/
│   ├── config/             # Environment & Appium Capabilties Configuration
│   ├── drivers/            # Appium Driver Manager (UiAutomator2, Android/iOS)
│   ├── pages/              # Page Object Model (POM) Page Classes
│   ├── tests/              # 150+ Mobile Pytest Automation Cases
│   ├── utils/              # Logger, Screenshot, API Validator & Helpers
│   ├── reports/            # Allure & HTML Reports
│   ├── conftest.py         # Pytest Hooks & Fixtures
│   ├── requirements.txt    # Python Dependencies
│   ├── Jenkinsfile         # Jenkins CI/CD Pipeline
│   └── Dockerfile          # Containerized Test Execution
│
└── Selenium-NodeJS/
    ├── config/             # Browser & Base URL Environment Config
    ├── drivers/            # Selenium WebDriver Factory (Chrome, Firefox, Edge)
    ├── pages/              # Page Object Model (POM) Page Classes
    ├── tests/              # 150+ Web Selenium Mocha Test Cases
    ├── utils/              # Logger, Screenshot & API Helpers
    ├── reports/            # Mochawesome & Allure Reports
    ├── .mocharc.js         # Mocha Runner Configuration
    ├── package.json        # Node.js Dependencies & NPM Scripts
    ├── Jenkinsfile         # Jenkins CI/CD Pipeline
    └── Dockerfile          # Containerized Test Execution
```

---

## 📊 Test Coverage & Case Count Summary

| Framework | Platform | Test Runner | Test Cases Count | Categories Covered |
| :--- | :--- | :--- | :--- | :--- |
| **Appium-Python** | Android / Mobile | Pytest | **150 Test Cases** | Auth, Navigation, Telemetry, AI Assistant, Profile, Security, Performance |
| **Selenium-NodeJS** | Chrome / Firefox / Edge | Mocha + Chai | **150 Test Cases** | Auth, Responsive UI, Security (SQLi/XSS/CSRF), SEO, Accessibility, RBAC |
| **Total Suite** | Enterprise Cross-Platform | Hybrid | **300+ Test Cases** | Full End-to-End Enterprise System Validation |

---

## 🛠️ Quick Start Guide

### 1. Running Appium Python Mobile Tests
```bash
cd RoadSense-Automation/Appium-Python

# Install dependencies
pip install -r requirements.txt

# Run all 150+ mobile test cases
pytest

# Run only Smoke tests
pytest -m smoke

# Generate Allure Report
allure serve reports/allure-results
```

### 2. Running Selenium Node.js Web Tests
```bash
cd RoadSense-Automation/Selenium-NodeJS

# Install npm packages
npm install

# Run all 150+ web test cases
npm test

# Run in parallel
npm run test:parallel

# Generate Mochawesome HTML Report
npm run report:mochawesome
```

---

## 🐳 Docker Execution

```bash
# Run Selenium Web Suite in Docker
docker build -t roadsense-selenium ./Selenium-NodeJS
docker run --rm roadsense-selenium

# Run Appium Mobile Suite in Docker
docker build -t roadsense-appium ./Appium-Python
docker run --rm roadsense-appium
```
