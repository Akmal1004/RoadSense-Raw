# Troubleshooting Guide — RoadSense CI/CD & Selenium E2E Framework

This guide lists diagnostic procedures and solutions for common issues encountered during local execution or GitHub Actions workflow runs.

---

## 1. Common Issues & Solutions

### Issue 1: `ValueError: [CRITICAL SECURITY & POLICY ERROR] Execution against localhost/dev servers is strictly prohibited in CI!`
- **Cause**: `BASE_URL` is set to `localhost` or `127.0.0.1` while running in CI context.
- **Solution**: Ensure `BASE_URL` environment variable is set to the live GitHub Pages URL: `https://<username>.github.io/<repo>/`.

---

### Issue 2: Stage 7 Deployment Verification Failed (HTTP Status non-200)
- **Cause**: GitHub Pages has not finished publishing or the URL is incorrect.
- **Solution**:
  1. Check GitHub Repository -> **Settings** -> **Pages** and confirm GitHub Pages build status.
  2. Verify repository permissions include `pages: write` and `id-token: write`.

---

### Issue 3: ChromeDriver / Chrome Version Mismatch
- **Cause**: Chrome browser auto-updated while ChromeDriver remained cached.
- **Solution**:
  `webdriver-manager` handles driver matching automatically. Clear cache via:
  ```bash
  pip install --upgrade webdriver-manager
  ```

---

### Issue 4: Pytest `-n auto` Parallel Run Out of Memory (OOM)
- **Cause**: Too many parallel Chrome instances launched on small runners.
- **Solution**: Limit pytest workers to a fixed count, e.g. `pytest -n 4`.

---

### Issue 5: Missing Excel Report Dependencies (`ModuleNotFoundError: No module named 'openpyxl'`)
- **Solution**:
  ```bash
  pip install openpyxl jinja2 pillow
  ```
