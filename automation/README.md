# RoadSense Selenium E2E Automation Framework

An enterprise-grade, Page Object Model (POM) based Selenium WebDriver automation framework designed for live deployment testing.

---

## Folder Structure

```
automation/
├── config/
│   └── config.py               # Environment, BASE_URL, timeout & policy configurations
├── data/
│   └── test_data.py            # Test dataset fixtures and parameters
├── drivers/
│   └── driver_factory.py       # Chrome Headless WebDriver initialization
├── pages/
│   ├── base_page.py            # Base POM class (waits, JS execution, actions)
│   ├── login_page.py           # Auth POM
│   ├── dashboard_page.py       # Dashboard POM
│   ├── navigation_page.py      # Navigation bar POM
│   ├── forms_page.py           # Forms POM
│   ├── crud_page.py            # CRUD Data Table POM
│   ├── upload_page.py          # File upload POM
│   └── settings_page.py        # Settings POM
├── tests/
│   ├── test_auth.py            # 40 Test Cases (TC-AUTH-001..040)
│   ├── test_authorization.py   # 40 Test Cases (TC-AUTHZ-001..040)
│   ├── test_navigation.py      # 30 Test Cases (TC-NAV-001..030)
│   ├── test_ui_validation.py   # 50 Test Cases (TC-UI-001..050)
│   ├── test_forms.py           # 50 Test Cases (TC-FORM-001..050)
│   ├── test_crud_operations.py # 50 Test Cases (TC-CRUD-001..050)
│   ├── test_input_validation.py# 40 Test Cases (TC-VAL-001..040)
│   ├── test_error_handling.py   # 20 Test Cases (TC-ERR-001..020)
│   ├── test_session_management.py# 20 Test Cases (TC-SES-001..020)
│   ├── test_file_upload.py     # 20 Test Cases (TC-UPL-001..020)
│   ├── test_accessibility.py   # 20 Test Cases (TC-A11Y-001..020)
│   ├── test_responsive_design.py# 20 Test Cases (TC-RESP-001..020)
│   ├── test_performance_smoke.py# 20 Test Cases (TC-PERF-001..020)
│   └── test_regression.py      # 50 Test Cases (TC-REG-001..050) Total: 420 Test Cases
├── utils/
│   ├── logger.py               # Custom logging utility
│   ├── screenshot_utils.py     # Failure screenshot capture
│   ├── wait_utils.py           # Explicit wait helper wrappers
│   ├── verify_deployment.py    # Deployment HTTP check script
│   ├── excel_reporter.py       # openpyxl multi-sheet workbook generator
│   ├── html_reporter.py        # HTML & Chart.js dashboard generator
│   └── summary_generator.py    # GitHub Step Summary formatter
├── conftest.py                 # Pytest hooks, fixtures & test collectors
└── requirements.txt            # Python dependencies
```

---

## 420 Test Cases Summary

| Category | Test Case Range | Count |
|---|---|---|
| Authentication | `TC-AUTH-001` .. `040` | 40 |
| Authorization | `TC-AUTHZ-001` .. `040` | 40 |
| Navigation | `TC-NAV-001` .. `030` | 30 |
| UI Validation | `TC-UI-001` .. `050` | 50 |
| Forms | `TC-FORM-001` .. `050` | 50 |
| CRUD Operations | `TC-CRUD-001` .. `050` | 50 |
| Input Validation | `TC-VAL-001` .. `040` | 40 |
| Error Handling | `TC-ERR-001` .. `020` | 20 |
| Session Management | `TC-SES-001` .. `020` | 20 |
| File Upload | `TC-UPL-001` .. `020` | 20 |
| Accessibility | `TC-A11Y-001` .. `020` | 20 |
| Responsive Design | `TC-RESP-001` .. `020` | 20 |
| Performance Smoke | `TC-PERF-001` .. `020` | 20 |
| Regression | `TC-REG-001` .. `050` | 50 |
| **Total** | | **420** |
