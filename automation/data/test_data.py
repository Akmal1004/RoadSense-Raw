"""Test Data management module providing structured datasets for E2E execution."""

class TestData:
    VALID_USER = {
        "email": "driver.admin@roadsense.io",
        "password": "Password123!",
        "role": "FleetManager",
        "full_name": "RoadSense Fleet Administrator"
    }

    INVALID_USERS = [
        {"email": "invalid@roadsense.io", "password": "WrongPassword!", "reason": "Invalid Password"},
        {"email": "nonexistent@roadsense.io", "password": "Password123!", "reason": "User Not Found"},
        {"email": "", "password": "Password123!", "reason": "Empty Email"},
        {"email": "driver.admin@roadsense.io", "password": "", "reason": "Empty Password"},
        {"email": "invalid-email-format", "password": "Password123!", "reason": "Malformed Email"}
    ]

    NAVIGATION_LINKS = [
        {"name": "Dashboard", "endpoint": "", "expected_header": "Dashboard"},
        {"name": "Analytics", "endpoint": "analytics", "expected_header": "Analytics"},
        {"name": "Routes", "endpoint": "routes", "expected_header": "Routes"},
        {"name": "Reports", "endpoint": "reports", "expected_header": "Reports"},
        {"name": "Settings", "endpoint": "settings", "expected_header": "Settings"},
        {"name": "Drivers", "endpoint": "drivers", "expected_header": "Drivers"},
        {"name": "Vehicles", "endpoint": "vehicles", "expected_header": "Vehicles"},
        {"name": "Alerts", "endpoint": "alerts", "expected_header": "Alerts"}
    ]

    SAMPLE_FORM_DATA = {
        "vehicle_name": "Tesla Semi Fleet #402",
        "driver_id": "DRV-8829",
        "route": "Highway 101 North - Express",
        "license_plate": "CA-8921-X",
        "vin": "11823901928301923",
        "notes": "Automated E2E Test Entry for RoadSense Fleet Management System."
    }

    FILE_UPLOAD_SAMPLES = [
        {"filename": "route_telemetry.csv", "type": "text/csv", "content": "timestamp,lat,lng,speed\n2026-07-26T20:00:00,37.7749,-122.4194,65.2"},
        {"filename": "driver_license.png", "type": "image/png", "content": "fake_image_bytes"},
        {"filename": "fleet_report.pdf", "type": "application/pdf", "content": "fake_pdf_bytes"}
    ]

    API_ENDPOINTS = [
        {"name": "Telemetry Feed", "path": "api/telemetry"},
        {"name": "Vehicle Status", "path": "api/vehicles"},
        {"name": "Driver Alerts", "path": "api/alerts"}
    ]
