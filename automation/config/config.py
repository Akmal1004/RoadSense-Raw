import os

class Config:
    """Enterprise Configuration Manager for Selenium Automation Framework."""
    
    # Environment & Base URL Configuration
    # Live GitHub Pages Deployment target default
    DEFAULT_BASE_URL = "https://akmal1004.github.io/RoadSense-Raw/"
    BASE_URL = os.getenv("BASE_URL", DEFAULT_BASE_URL).rstrip('/') + '/'
    
    # CI Environment Detection
    IS_CI = os.getenv("CI", "false").lower() == "true" or os.getenv("GITHUB_ACTIONS", "false").lower() == "true"
    
    # Validation against forbidden localhost execution in CI
    if IS_CI and ("localhost" in BASE_URL or "127.0.0.1" in BASE_URL or "0.0.0.0" in BASE_URL):
        raise ValueError(
            f"[CRITICAL SECURITY & POLICY ERROR] Selenium E2E tests are configured to run against '{BASE_URL}'. "
            f"Execution against localhost/dev servers is strictly prohibited in CI! "
            f"Tests MUST run against the LIVE deployed URL."
        )

    # Driver Settings
    BROWSER = os.getenv("BROWSER", "chrome").lower()
    HEADLESS = os.getenv("HEADLESS", "true").lower() == "true"
    WINDOW_SIZE = os.getenv("WINDOW_SIZE", "1920,1080")
    
    # Timeouts (seconds)
    IMPLICIT_WAIT = int(os.getenv("IMPLICIT_WAIT", "10"))
    EXPLICIT_WAIT = int(os.getenv("EXPLICIT_WAIT", "15"))
    PAGE_LOAD_TIMEOUT = int(os.getenv("PAGE_LOAD_TIMEOUT", "30"))
    
    # Retry & Parallel Execution
    MAX_RETRIES = int(os.getenv("MAX_RETRIES", "2"))
    CRITICAL_PASS_THRESHOLD = float(os.getenv("CRITICAL_PASS_THRESHOLD", "95.0"))
    
    # Paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ROOT_DIR = os.path.dirname(BASE_DIR)
    RESULTS_DIR = os.path.join(ROOT_DIR, "Test Results")
    
    EXCEL_DIR = os.path.join(RESULTS_DIR, "Excel")
    HTML_DIR = os.path.join(RESULTS_DIR, "HTML")
    SCREENSHOT_DIR = os.path.join(RESULTS_DIR, "Screenshots")
    LOG_DIR = os.path.join(RESULTS_DIR, "Logs")
    JSON_DIR = os.path.join(RESULTS_DIR, "JSON")
    SUMMARY_DIR = os.path.join(RESULTS_DIR, "Summary")
    
    # Credentials / Test User Data
    DEFAULT_USERNAME = os.getenv("TEST_USERNAME", "admin@roadsense.io")
    DEFAULT_PASSWORD = os.getenv("TEST_PASSWORD", "RoadSense2026!Secure")

    @classmethod
    def get_url(cls, endpoint: str = "") -> str:
        """Construct full target URL for test execution."""
        endpoint = endpoint.lstrip('/')
        return f"{cls.BASE_URL}{endpoint}"
