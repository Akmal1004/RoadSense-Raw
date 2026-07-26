import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    APPIUM_SERVER_URL = os.getenv("APPIUM_SERVER_URL", "http://127.0.0.1:4723")
    PLATFORM_NAME = os.getenv("PLATFORM_NAME", "Android")
    PLATFORM_VERSION = os.getenv("PLATFORM_VERSION", "14.0")
    DEVICE_NAME = os.getenv("DEVICE_NAME", "Android Emulator")
    AUTOMATION_NAME = os.getenv("AUTOMATION_NAME", "UiAutomator2")
    APP_PACKAGE = os.getenv("APP_PACKAGE", "com.roadsense.app")
    APP_ACTIVITY = os.getenv("APP_ACTIVITY", ".MainActivity")
    APP_PATH = os.getenv("APP_PATH", os.path.abspath("./resources/RoadSense.apk"))
    BASE_URL = os.getenv("BASE_URL", "http://localhost:8082")
    API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5000/api")
    IMPLICIT_WAIT = int(os.getenv("IMPLICIT_WAIT", 10))
    EXPLICIT_WAIT = int(os.getenv("EXPLICIT_WAIT", 15))
