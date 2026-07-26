import requests
from config.config import Config
from utils.logger import get_logger

logger = get_logger("APIValidator")

class APIValidator:
    @staticmethod
    def check_backend_health() -> bool:
        try:
            response = requests.get(f"{Config.API_BASE_URL}/health", timeout=5)
            logger.info(f"API Health response code: {response.status_code}")
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Backend API health check failed: {e}")
            return False

    @staticmethod
    def get_user_profile(user_id: str) -> dict:
        try:
            response = requests.get(f"{Config.API_BASE_URL}/user/profile/{user_id}", timeout=5)
            if response.status_code == 200:
                return response.json().get("user", {})
            return {}
        except Exception as e:
            logger.error(f"API get_user_profile failed for {user_id}: {e}")
            return {}

    @staticmethod
    def get_trip_stats(user_id: str) -> dict:
        try:
            response = requests.get(f"{Config.API_BASE_URL}/stats/{user_id}", timeout=5)
            if response.status_code == 200:
                return response.json().get("stats", {})
            return {}
        except Exception as e:
            logger.error(f"API get_trip_stats failed for {user_id}: {e}")
            return {}
