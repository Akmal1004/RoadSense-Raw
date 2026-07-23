import os
import pymysql
from pymysql.cursors import DictCursor
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "roadsense_db")
DEFAULT_PORT = int(os.getenv("DB_PORT", "3306"))

def get_db_connection():
    """Establishes and returns a PyMySQL connection to XAMPP MySQL."""
    ports_to_try = [DEFAULT_PORT]
    if DEFAULT_PORT != 3307:
        ports_to_try.append(3307)

    last_err = None
    for port in ports_to_try:
        try:
            return pymysql.connect(
                host=DB_HOST,
                port=port,
                user=DB_USER,
                password=DB_PASSWORD,
                database=DB_NAME,
                cursorclass=DictCursor,
                autocommit=True,
                connect_timeout=3
            )
        except pymysql.OperationalError as err:
            last_err = err
            continue

    raise pymysql.OperationalError(
        2003,
        "Can't connect to MySQL server on '127.0.0.1'. Please open XAMPP Control Panel and click 'Start' next to MySQL."
    ) from last_err

def test_db_connection() -> bool:
    """Tests connection to XAMPP MySQL database."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1")
        conn.close()
        print(f"[RoadSense Python API] Successfully connected to XAMPP MySQL at {DB_HOST}:{DEFAULT_PORT} ({DB_NAME})")
        return True
    except Exception as e:
        print(f"[RoadSense Python API] Connection notice: XAMPP MySQL is currently stopped or not responding. {e}")
        return False
