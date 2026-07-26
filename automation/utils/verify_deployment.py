"""Stage 7: Deployment Verification Script.

Validates that the live GitHub Pages deployment is available and intact before E2E testing.
"""

import sys
import requests
from automation.config.config import Config

def verify_deployment() -> bool:
    target_url = Config.BASE_URL
    print(f"====================================================")
    print(f"STAGE 7: DEPLOYMENT VERIFICATION")
    print(f"Target URL: {target_url}")
    print(f"====================================================")

    diagnostics = []
    success = True

    try:
        response = requests.get(target_url, timeout=15)
        status_code = response.status_code
        print(f"[CHECK 1] Target HTTP Status Code: {status_code}")

        if status_code != 200:
            success = False
            diagnostics.append(f"HTTP Status code is {status_code}, expected 200 OK.")
        else:
            print(f"[OK] Target URL returned HTTP 200 OK.")

        # Check content length
        content = response.text
        if len(content) < 100:
            success = False
            diagnostics.append("Page body content length is suspiciously small (<100 bytes).")
        else:
            print(f"[OK] Body payload size: {len(content)} bytes.")

        # Check basic HTML structure
        if "<html" not in content.lower() and "<!doctype html" not in content.lower():
            success = False
            diagnostics.append("HTML document missing <html> declaration.")
        else:
            print("[OK] HTML structure verified.")

    except Exception as e:
        success = False
        diagnostics.append(f"Network request error trying to reach {target_url}: {str(e)}")

    if not success:
        print("\n[FAIL] DEPLOYMENT VERIFICATION FAILED!")
        print("Diagnostics Summary:")
        for diag in diagnostics:
            print(f" - {diag}")
        return False

    print("\n[SUCCESS] DEPLOYMENT VERIFICATION PASSED SUCCESSFULLY!")
    return True

if __name__ == "__main__":
    is_valid = verify_deployment()
    if not is_valid:
        sys.exit(1)
    sys.exit(0)
