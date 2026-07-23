import uvicorn
from database import test_db_connection

if __name__ == "__main__":
    print("===========================================================")
    print("🚀 Starting RoadSense AI Python FastAPI Backend Server...")
    print("===========================================================")
    test_db_connection()
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
