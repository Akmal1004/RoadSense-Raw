# CI/CD Execution Guide — GitHub Actions Pipeline

This guide documents the enterprise CI/CD pipeline implemented in `.github/workflows/deploy-and-test.yml`.

---

## 1. Overview & Triggers

The workflow triggers automatically on:
- **`push`** to `main` or `master` branches.
- **`pull_request`** targeting `main` or `master`.
- **`workflow_dispatch`** (Manual execution via GitHub UI).

---

## 2. Pipeline Stages

The workflow executes 13 distinct stages in strict sequence:

1. **Stage 1: Repository Checkout**: Checks out repository code (`actions/checkout@v4`).
2. **Stage 2: Dependency Installation**: Prepares Node.js 20 and Python 3.12, running `npm ci` and `pip install -r automation/requirements.txt`.
3. **Stage 3: Build Application**: Compiles Expo static web export into `./dist`.
4. **Stage 4: Static Analysis**: Executes TypeScript type checking (`npm run typecheck`).
5. **Stage 5: Deploy to GitHub Pages**: Publishes `./dist` to `gh-pages` branch via `peaceiris/actions-gh-pages@v4`.
6. **Stage 6: Wait for Deployment**: Delays execution to allow CDN propagation.
7. **Stage 7: Deployment Verification**: Executes `automation/utils/verify_deployment.py` to confirm HTTP 200 OK and asset integrity.
8. **Stage 8: Run Selenium E2E Tests**: Launches 420 Selenium test cases against the **LIVE** `BASE_URL`.
9. **Stage 9: Generate Reports**: Constructs HTML execution report (`execution-report.html`) and visual dashboard (`dashboard.html`).
10. **Stage 10: Generate Excel Reports**: Builds 4 Excel workbooks (`Automation_Test_Report.xlsx`, `Failed_Test_Cases.xlsx`, `Passed_Test_Cases.xlsx`, `Summary_Report.xlsx`).
11. **Stage 11: Upload Artifacts**: Uploads `Test Results/` with 30-day retention (`actions/upload-artifact@v4`).
12. **Stage 12: Publish Summary**: Appends Markdown report to `$GITHUB_STEP_SUMMARY`.
13. **Stage 13: Store Historical Results**: Preserves execution JSON logs in `.historical_reports/`.

---

## 3. Pass / Fail Policy

- **Success Condition**: Deployment succeeds **AND** overall test pass percentage \(\ge 95\%\).
- **Failure Condition**: Deployment verification fails **OR** test pass percentage drops below \(95\%\).
