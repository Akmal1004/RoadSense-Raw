"""HTML Report & Visual Analytics Dashboard Generator."""

import os
import json
from datetime import datetime
from automation.config.config import Config

class HTMLReporter:
    """Generates professional HTML execution report and visual Analytics Dashboard."""

    @classmethod
    def generate_html_reports(cls, test_results: list, metrics: dict):
        """Generate execution-report.html and dashboard.html."""
        os.makedirs(Config.HTML_DIR, exist_ok=True)
        cls._generate_execution_report(test_results, metrics)
        cls._generate_dashboard(test_results, metrics)

    @classmethod
    def _generate_execution_report(cls, test_results: list, metrics: dict):
        file_path = os.path.join(Config.HTML_DIR, "execution-report.html")
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

        rows_html = ""
        for r in test_results:
            status_class = "status-pass" if r["status"] == "PASS" else ("status-fail" if r["status"] == "FAIL" else "status-skip")
            error_html = f"<div class='error-msg'>{r.get('error_message', '')}</div>" if r.get('error_message') else ""
            rows_html += f"""
            <tr class="test-row {status_class}">
                <td><code>{r.get('test_id')}</code></td>
                <td><span class="badge badge-module">{r.get('module')}</span></td>
                <td><strong>{r.get('test_name')}</strong></td>
                <td><span class="badge {status_class}">{r.get('status')}</span></td>
                <td>{r.get('duration', 0.0):.2f}s</td>
                <td><span class="badge badge-prio">{r.get('priority', 'P2')}</span></td>
                <td>{error_html}</td>
            </tr>
            """

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RoadSense E2E Selenium Test Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-primary: #0f172a;
            --bg-card: #1e293b;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent-pass: #22c55e;
            --accent-fail: #ef4444;
            --accent-skip: #f59e0b;
            --accent-blue: #3b82f6;
            --border-color: #334155;
        }}
        body {{
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-primary);
            color: var(--text-main);
            margin: 0;
            padding: 30px;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .metric-card {{
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
        }}
        .metric-val {{
            font-size: 2.2rem;
            font-weight: 700;
            margin-top: 10px;
        }}
        .val-pass {{ color: var(--accent-pass); }}
        .val-fail {{ color: var(--accent-fail); }}
        .val-skip {{ color: var(--accent-skip); }}
        .val-total {{ color: var(--accent-blue); }}
        
        .table-container {{
            background: var(--bg-card);
            border-radius: 12px;
            border: 1px solid var(--border-color);
            overflow-x: auto;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            text-align: left;
        }}
        th, td {{
            padding: 14px 18px;
            border-bottom: 1px solid var(--border-color);
        }}
        th {{
            background-color: #0f172a;
            color: var(--text-muted);
            font-weight: 600;
            font-size: 0.85rem;
            text-transform: uppercase;
        }}
        .badge {{
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 700;
        }}
        .badge-module {{ background: #334155; color: #e2e8f0; }}
        .badge-prio {{ background: #475569; color: #f8fafc; }}
        .status-pass {{ background: rgba(34, 197, 94, 0.15); color: #4ade80; }}
        .status-fail {{ background: rgba(239, 68, 68, 0.15); color: #f87171; }}
        .status-skip {{ background: rgba(245, 158, 11, 0.15); color: #fbbf24; }}
        .error-msg {{
            color: #f87171;
            font-size: 0.8rem;
            font-family: monospace;
            background: rgba(0,0,0,0.3);
            padding: 6px;
            border-radius: 4px;
        }}
        .filter-btn {{
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            color: var(--text-main);
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            margin-right: 8px;
            font-weight: 600;
        }}
        .filter-btn.active {{
            background: var(--accent-blue);
            border-color: var(--accent-blue);
        }}
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>RoadSense Live E2E Execution Report</h1>
            <p style="color: var(--text-muted);">Target: <code>{metrics.get('base_url', Config.BASE_URL)}</code> | Run Time: {timestamp}</p>
        </div>
    </div>

    <div class="metrics-grid">
        <div class="metric-card">
            <div>TOTAL TESTS</div>
            <div class="metric-val val-total">{metrics.get('total', 0)}</div>
        </div>
        <div class="metric-card">
            <div>PASSED</div>
            <div class="metric-val val-pass">{metrics.get('passed', 0)}</div>
        </div>
        <div class="metric-card">
            <div>FAILED</div>
            <div class="metric-val val-fail">{metrics.get('failed', 0)}</div>
        </div>
        <div class="metric-card">
            <div>SKIPPED</div>
            <div class="metric-val val-skip">{metrics.get('skipped', 0)}</div>
        </div>
        <div class="metric-card">
            <div>SUCCESS RATE</div>
            <div class="metric-val val-pass">{metrics.get('pass_rate', 0.0):.1f}%</div>
        </div>
    </div>

    <div style="margin-bottom: 20px;">
        <button class="filter-btn active" onclick="filterStatus('all')">All Tests</button>
        <button class="filter-btn" onclick="filterStatus('status-pass')">Passed Only</button>
        <button class="filter-btn" onclick="filterStatus('status-fail')">Failed Only</button>
    </div>

    <div class="table-container">
        <table id="test-table">
            <thead>
                <tr>
                    <th>Test ID</th>
                    <th>Module</th>
                    <th>Test Name</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Priority</th>
                    <th>Diagnostics / Error</th>
                </tr>
            </thead>
            <tbody>
                {rows_html}
            </tbody>
        </table>
    </div>

    <script>
        function filterStatus(statusClass) {{
            const rows = document.querySelectorAll('.test-row');
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            rows.forEach(row => {{
                if (statusClass === 'all' || row.classList.contains(statusClass)) {{
                    row.style.display = '';
                }} else {{
                    row.style.display = 'none';
                }}
            }});
        }}
    </script>
</body>
</html>
"""
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        print(f"[SUCCESS] Generated HTML Execution Report: {file_path}")

    @classmethod
    def _generate_dashboard(cls, test_results: list, metrics: dict):
        file_path = os.path.join(Config.HTML_DIR, "dashboard.html")
        
        # Calculate module breakdown
        modules_stats = {}
        for r in test_results:
            mod = r.get("module", "General")
            if mod not in modules_stats:
                modules_stats[mod] = {"passed": 0, "failed": 0, "skipped": 0}
            st = r.get("status", "PASS").lower()
            if st in modules_stats[mod]:
                modules_stats[mod][st] += 1

        mod_labels = list(modules_stats.keys())
        mod_passed = [modules_stats[m]["passed"] for m in mod_labels]
        mod_failed = [modules_stats[m]["failed"] for m in mod_labels]

        dashboard_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>RoadSense E2E Analytics Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body {{
            font-family: 'Inter', sans-serif;
            background: #090d16;
            color: #f1f5f9;
            padding: 30px;
            margin: 0;
        }}
        .grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-top: 30px;
        }}
        .card {{
            background: #111827;
            border: 1px solid #1f2937;
            border-radius: 12px;
            padding: 24px;
        }}
        h2 {{ margin-top: 0; font-size: 1.2rem; color: #9ca3af; }}
    </style>
</head>
<body>
    <h1>RoadSense Automation Executive Dashboard</h1>
    <p style="color: #6b7280;">Live E2E Test Execution Visualization against <code>{metrics.get('base_url', Config.BASE_URL)}</code></p>

    <div class="grid">
        <div class="card">
            <h2>Overall Status Distribution</h2>
            <canvas id="statusChart"></canvas>
        </div>
        <div class="card">
            <h2>Module Pass/Fail Breakdown</h2>
            <canvas id="moduleChart"></canvas>
        </div>
    </div>

    <script>
        // Status Doughnut Chart
        new Chart(document.getElementById('statusChart'), {{
            type: 'doughnut',
            data: {{
                labels: ['Passed', 'Failed', 'Skipped'],
                datasets: [{{
                    data: [{metrics.get('passed', 0)}, {metrics.get('failed', 0)}, {metrics.get('skipped', 0)}],
                    backgroundColor: ['#22c55e', '#ef4444', '#f59e0b']
                }}]
            }},
            options: {{ responsive: true, plugins: {{ legend: {{ labels: {{ color: '#f3f4f6' }} }} }} }}
        }});

        // Module Bar Chart
        new Chart(document.getElementById('moduleChart'), {{
            type: 'bar',
            data: {{
                labels: {json.dumps(mod_labels)},
                datasets: [
                    {{ label: 'Passed', data: {json.dumps(mod_passed)}, backgroundColor: '#22c55e' }},
                    {{ label: 'Failed', data: {json.dumps(mod_failed)}, backgroundColor: '#ef4444' }}
                ]
            }},
            options: {{
                responsive: true,
                scales: {{
                    x: {{ ticks: {{ color: '#9ca3af' }} }},
                    y: {{ ticks: {{ color: '#9ca3af' }} }}
                }},
                plugins: {{ legend: {{ labels: {{ color: '#f3f4f6' }} }} }}
            }}
        }});
    </script>
</body>
</html>
"""
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(dashboard_html)
        print(f"[SUCCESS] Generated HTML Analytics Dashboard: {file_path}")
