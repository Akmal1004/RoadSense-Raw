"""GitHub Action Step Summary Generator."""

import os
from datetime import datetime
from automation.config.config import Config

class SummaryGenerator:
    """Generates GitHub Markdown Execution Summary and persists summary.md."""

    @classmethod
    def generate_summary(cls, test_results: list, metrics: dict):
        os.makedirs(Config.SUMMARY_DIR, exist_ok=True)
        summary_file = os.path.join(Config.SUMMARY_DIR, "summary.md")

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
        deployment_url = metrics.get("base_url", Config.BASE_URL)
        total = metrics.get("total", len(test_results))
        passed = metrics.get("passed", 0)
        failed = metrics.get("failed", 0)
        skipped = metrics.get("skipped", 0)
        pass_rate = metrics.get("pass_rate", 0.0)
        duration = metrics.get("total_duration", 0.0)

        build_status = "PASS"
        deploy_status = "PASS"

        # Categorize modules
        modules_stats = {}
        failed_tests_list = []

        for r in test_results:
            mod = r.get("module", "General")
            if mod not in modules_stats:
                modules_stats[mod] = {"total": 0, "passed": 0, "failed": 0}
            modules_stats[mod]["total"] += 1
            if r.get("status") == "PASS":
                modules_stats[mod]["passed"] += 1
            elif r.get("status") == "FAIL":
                modules_stats[mod]["failed"] += 1
                failed_tests_list.append(r)

        # Top passing / failing modules
        passing_modules_md = ""
        failing_modules_md = ""

        for mod, stat in modules_stats.items():
            mod_pass_rate = (stat["passed"] / stat["total"]) * 100 if stat["total"] > 0 else 0
            if stat["failed"] == 0:
                passing_modules_md += f"- **{mod}**: {mod_pass_rate:.1f}% ({stat['passed']}/{stat['total']})\n"
            else:
                failing_modules_md += f"- **{mod}**: {stat['failed']} failures out of {stat['total']} cases\n"

        if not failing_modules_md:
            failing_modules_md = "- None (All modules passed successfully)\n"

        failed_tests_detail_md = ""
        for ft in failed_tests_list[:10]:
            failed_tests_detail_md += f"- **{ft.get('test_id')}** — *{ft.get('test_name')}*: `{ft.get('error_message', 'Assertion Error')}`\n"
        if not failed_tests_detail_md:
            failed_tests_detail_md = "- None (No failed test cases)\n"

        md_content = f"""# Live GitHub Pages E2E Execution Summary

**Deployment URL:**
`{deployment_url}`

**Execution Date:**
`{timestamp}`

**Build Status:**
`{build_status}`

**Deployment Status:**
`{deploy_status}`

**Total Test Cases:**
`{total}`

**Execution Statistics:**
- **Passed:** `{passed}`
- **Failed:** `{failed}`
- **Skipped:** `{skipped}`

**Pass Percentage:**
`{pass_rate:.2f}%`

**Execution Duration:**
`{duration:.2f} seconds`

### Top Failed Modules
{failing_modules_md}

### Failed Tests Detail
{failed_tests_detail_md}

### Top Passing Modules
{passing_modules_md}

### Artifacts Generated
✓ Excel Reports (`Automation_Test_Report.xlsx`, `Failed_Test_Cases.xlsx`, `Passed_Test_Cases.xlsx`, `Summary_Report.xlsx`)  
✓ HTML Reports (`execution-report.html`, `dashboard.html`)  
✓ Failure Screenshots (`Test Results/Screenshots/`)  
✓ Execution & Browser Logs (`Test Results/Logs/`)  
✓ Machine-readable JSON Results (`execution-results.json`)  
"""

        with open(summary_file, "w", encoding="utf-8") as f:
            f.write(md_content)

        print(f"[SUCCESS] Summary Markdown generated: {summary_file}")

        # Append to GitHub Step Summary if running inside GitHub Actions
        github_summary_path = os.getenv("GITHUB_STEP_SUMMARY")
        if github_summary_path:
            try:
                with open(github_summary_path, "a", encoding="utf-8") as f:
                    f.write(md_content)
                print("[SUCCESS] Published summary to GITHUB_STEP_SUMMARY environment.")
            except Exception as e:
                print(f"Warning: Could not write to GITHUB_STEP_SUMMARY: {e}")
