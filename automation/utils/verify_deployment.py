"""Stage 7: Deployment Verification Script.

Validates that the live GitHub Pages deployment is available and intact before E2E testing.
Includes retry logic for initial CDN propagation delays.
"""

import sys
import time
import requests
from automation.config.config import Config

def verify_deployment(max_retries: int = 6, delay_seconds: int = 10) -> bool:
    target_url = Config.BASE_URL
    print(f"====================================================")
    print(f"STAGE 7: DEPLOYMENT VERIFICATION")
    print(f"Target URL: {target_url}")
    print(f"====================================================")

    for attempt in range(1, max_retries + 1):
        print(f"\n[ATTEMPT {attempt}/{max_retries}] Probing target endpoint...")
        diagnostics = []
        success = True

        try:
            response = requests.get(target_url, timeout=15)
            status_code = response.status_code
            print(f"[CHECK 1] HTTP Status Code: {status_code}")

            if status_code != 200:
                success = False
                diagnostics.append(f"HTTP Status code is {status_code}, expected 200 OK.")
            else:
                print(f"[OK] Target URL returned HTTP 200 OK.")

            content = response.text
            if len(content) < 100:
                success = False
                diagnostics.append("Page body content length is suspiciously small (<100 bytes).")
            else:
                print(f"[OK] Body payload size: {len(content)} bytes.")

            if "<html" not in content.lower() and "<!doctype html" not in content.lower():
                success = False
                diagnostics.append("HTML document missing <html> declaration.")
            else:
                print("[OK] HTML structure verified.")

        except Exception as e:
            success = False
            diagnostics.append(f"Network request error reaching {target_url}: {str(e)}")

        if success:
            print("\n[SUCCESS] DEPLOYMENT VERIFICATION PASSED SUCCESSFULLY!")
            return True
        else:
            print(f"Attempt {attempt} failed diagnostics:")
            for diag in diagnostics:
                print(f" - {diag}")
            if attempt < max_retries:
                print(f"Waiting {delay_seconds} seconds before retry for CDN propagation...")
                time.sleep(delay_seconds)

    print("\n[WARN] Live deployment target URL returned 404 / unavailable.")
    print("NOTE: Please ensure GitHub Pages is enabled in Repository Settings -> Pages -> Source: GitHub Actions / gh-pages branch.")
    return False

if __name__ == "__main__":
    is_valid = verify_deployment()
    if not is_valid:
        # Exit with warning 0 or 1 depending on environment
        sys.exit(1)
    sys.exit(0)
