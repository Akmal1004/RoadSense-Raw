# Local Execution Guide — Selenium E2E Testing Framework

This guide provides instructions for configuring and executing the **RoadSense Selenium E2E Automation Suite** on a local development workstation.

---

## 1. Prerequisites

Before running tests locally, ensure your environment meets the following requirements:
- **Python 3.10+**: Verify via `python --version`
- **Google Chrome Browser**: Installed and up-to-date.
- **Node.js 20+**: Required if building/exporting web static files locally.

---

## 2. Environment Setup

### Step 1: Navigate to Project Directory
```bash
cd "Roadsense"
```

### Step 2: Create Python Virtual Environment (Recommended)
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### Step 3: Install Automation Dependencies
```bash
pip install -r automation/requirements.txt
```

---

## 3. Configuration & Target URL

The framework connects to the **LIVE** GitHub Pages deployment by default. You can override the target URL using the `BASE_URL` environment variable:

### Windows PowerShell:
```powershell
$env:BASE_URL="https://akmal1004.github.io/RoadSense-Raw/"
$env:HEADLESS="false"
```

### Linux / macOS / Bash:
```bash
export BASE_URL="https://akmal1004.github.io/RoadSense-Raw/"
export HEADLESS="false"
```

> **Note**: Localhost testing is blocked during CI runs to enforce live testing policy.

---

## 4. Executing Test Suites

### Execute All 420 Test Cases (Parallel Mode)
```bash
pytest automation/tests/ -n auto
```

### Execute Specific Test Category
```bash
# Authentication Module (40 cases)
pytest automation/tests/test_auth.py

# UI Validation Module (50 cases)
pytest automation/tests/test_ui_validation.py

# Forms Module (50 cases)
pytest automation/tests/test_forms.py
```

### Headed Mode (Visible Browser)
```bash
pytest automation/tests/ --headless=false
```

---

## 5. Locating Test Reports

Upon test suite completion, report artifacts are generated automatically under `Test Results/`:

- **Excel Workbooks**: `Test Results/Excel/Automation_Test_Report.xlsx` (6 Sheets)
- **HTML Interactive Report**: `Test Results/HTML/execution-report.html`
- **Visual Dashboard**: `Test Results/HTML/dashboard.html`
- **Failure Screenshots**: `Test Results/Screenshots/`
- **Browser Logs**: `Test Results/Logs/`
- **Summary**: `Test Results/Summary/summary.md`
