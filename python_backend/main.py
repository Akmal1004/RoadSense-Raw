import time
import random
import pymysql
from typing import Optional, List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import get_db_connection, test_db_connection

app = FastAPI(
    title="RoadSense AI Navigation - Python FastAPI Backend",
    description="Python REST API Server connected to XAMPP MySQL Database (roadsense_db)",
    version="1.0.0"
)

# Enable CORS for Web and Mobile Clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory password reset storage
reset_codes_map = {}

# ─── Pydantic Request Models ──────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: Optional[str] = "password123"
    phone: Optional[str] = "+91 98765 43210"
    vehicleModel: Optional[str] = "Electric Vehicle"

class LoginRequest(BaseModel):
    email: str
    password: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    newPassword: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    vehicleModel: Optional[str] = None
    emergencyContact: Optional[str] = None
    bio: Optional[str] = None

class PreferencesRequest(BaseModel):
    defaultRouteType: Optional[str] = "safest"
    vehicleMileage: Optional[float] = 15.0
    fuelPrice: Optional[float] = 100.0
    units: Optional[str] = "metric"

class TripHistoryRequest(BaseModel):
    userId: Optional[str] = "usr_default_01"
    sourceName: Optional[str] = "Current Location"
    destinationName: Optional[str] = "Destination"
    sourceLat: Optional[float] = 0.0
    sourceLng: Optional[float] = 0.0
    destLat: Optional[float] = 0.0
    destLng: Optional[float] = 0.0
    preferredRouteType: Optional[str] = "safest"
    distanceKm: Optional[float] = 0.0
    etaMinutes: Optional[int] = 0
    fuelCost: Optional[float] = 0.0
    safetyScore: Optional[int] = 95

class ChatMessageRequest(BaseModel):
    userId: Optional[str] = "usr_default_01"
    role: str
    content: str
    timestamp: Optional[int] = None

# ─── Health Check Endpoint ───────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    db_connected = test_db_connection()
    return {
        "status": "ok",
        "service": "RoadSense AI Python FastAPI Backend",
        "database": "XAMPP MySQL Online" if db_connected else "XAMPP MySQL Offline (Click Start in XAMPP Control Panel)",
        "timestamp": time.time()
    }

# ─── Auth Endpoints ─────────────────────────────────────────────────────────

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest):
    normalized_email = data.email.strip().lower()
    user_id = f"usr_{int(time.time() * 1000)}"

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s", (normalized_email,))
            if cursor.fetchone():
                conn.close()
                raise HTTPException(status_code=400, detail="An account with this email address already exists.")

            joined_date = "July 2024"
            phone = data.phone.strip() if data.phone else "+91 98765 43210"
            vehicle = data.vehicleModel.strip() if data.vehicleModel else "Electric Vehicle"

            cursor.execute(
                """INSERT INTO users (id, name, email, password_hash, phone, avatar, vehicle_model, emergency_contact, bio, joined_date, member_tier)
                   VALUES (%s, %s, %s, %s, %s, 'account-circle', %s, '+91 98765 00911', 'Active RoadSense Driver', %s, 'Standard Member')""",
                (user_id, data.name.strip(), normalized_email, data.password or "password123", phone, vehicle, joined_date)
            )

            cursor.execute(
                """INSERT INTO user_preferences (user_id, default_route_type, vehicle_mileage, fuel_price, units)
                   VALUES (%s, 'safest', 15.00, 100.00, 'metric') ON DUPLICATE KEY UPDATE user_id = user_id""",
                (user_id,)
            )

            cursor.execute(
                """INSERT INTO trip_stats (user_id, planned_trips, total_distance, total_eta, fuel_used, fuel_cost, best_safety_score)
                   VALUES (%s, 0, 0.00, 0, 0.00, 0.00, 0) ON DUPLICATE KEY UPDATE user_id = user_id""",
                (user_id,)
            )

        conn.close()

        user_profile = {
            "id": user_id,
            "name": data.name.strip(),
            "email": normalized_email,
            "phone": phone,
            "avatar": "account-circle",
            "vehicleModel": vehicle,
            "emergencyContact": "+91 98765 00911",
            "bio": "Active RoadSense Driver",
            "joinedDate": joined_date,
            "memberTier": "Standard Member"
        }
        return {"user": user_profile, "message": "User registered successfully."}
    except HTTPException:
        raise
    except pymysql.OperationalError as op_err:
        print(f"[Register Error] MySQL Connection Error: {op_err}")
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to MySQL. Please open XAMPP Control Panel and click 'Start' next to MySQL."
        )
    except Exception as e:
        print(f"[Register Error] {e}")
        raise HTTPException(status_code=500, detail=f"Database registration error: {str(e)}")

@app.post("/api/auth/login")
def login(data: LoginRequest):
    normalized_email = data.email.strip().lower()
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE email = %s", (normalized_email,))
            row = cursor.fetchone()

        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="No account found with this email.")

        if data.password and row["password_hash"] != data.password:
            raise HTTPException(status_code=401, detail="Incorrect password.")

        user_profile = {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "phone": row["phone"],
            "avatar": row["avatar"],
            "vehicleModel": row["vehicle_model"],
            "emergencyContact": row["emergency_contact"],
            "bio": row["bio"],
            "joinedDate": row["joined_date"],
            "memberTier": row["member_tier"]
        }
        return {"user": user_profile, "message": "Sign in successful."}
    except HTTPException:
        raise
    except pymysql.OperationalError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to MySQL. Please open XAMPP Control Panel and click 'Start' next to MySQL."
        )
    except Exception as e:
        print(f"[Login Error] {e}")
        raise HTTPException(status_code=500, detail="Database login failed.")

@app.post("/api/auth/forgot-password")
def forgot_password(data: ForgotPasswordRequest):
    normalized_email = data.email.strip().lower()
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s", (normalized_email,))
            row = cursor.fetchone()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="No account found with this email.")

        code = str(random.randint(1000, 9999))
        reset_codes_map[normalized_email] = code
        return {"code": code, "message": f"Reset code generated: {code}"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Forgot password processing failed.")

@app.post("/api/auth/reset-password")
def reset_password(data: ResetPasswordRequest):
    normalized_email = data.email.strip().lower()
    valid_code = reset_codes_map.get(normalized_email)

    if not valid_code or valid_code != data.code.strip():
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("UPDATE users SET password_hash = %s WHERE email = %s", (data.newPassword, normalized_email))
        conn.close()

        reset_codes_map.pop(normalized_email, None)
        return {"message": "Password reset successful."}
    except Exception:
        raise HTTPException(status_code=500, detail="Password reset failed.")

# ─── User Profile & Preferences ─────────────────────────────────────────────

@app.get("/api/user/profile/{user_id}")
def get_profile(user_id: str):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
        conn.close()

        if not row:
            raise HTTPException(status_code=404, detail="User not found.")

        user_profile = {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "phone": row["phone"],
            "avatar": row["avatar"],
            "vehicleModel": row["vehicle_model"],
            "emergencyContact": row["emergency_contact"],
            "bio": row["bio"],
            "joinedDate": row["joined_date"],
            "memberTier": row["member_tier"]
        }
        return {"user": user_profile}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch profile.")

@app.put("/api/user/profile/{user_id}")
def update_profile(user_id: str, data: ProfileUpdateRequest):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """UPDATE users 
                   SET name = COALESCE(%s, name),
                       phone = COALESCE(%s, phone),
                       avatar = COALESCE(%s, avatar),
                       vehicle_model = COALESCE(%s, vehicle_model),
                       emergency_contact = COALESCE(%s, emergency_contact),
                       bio = COALESCE(%s, bio)
                   WHERE id = %s""",
                (data.name, data.phone, data.avatar, data.vehicleModel, data.emergencyContact, data.bio, user_id)
            )

            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
        conn.close()

        updated_user = {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "phone": row["phone"],
            "avatar": row["avatar"],
            "vehicleModel": row["vehicle_model"],
            "emergencyContact": row["emergency_contact"],
            "bio": row["bio"],
            "joinedDate": row["joined_date"],
            "memberTier": row["member_tier"]
        }
        return {"user": updated_user, "message": "Profile updated."}
    except Exception as e:
        print(f"[Update Profile Error] {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile.")

# ─── Trip Stats & History ───────────────────────────────────────────────────

@app.get("/api/stats/{user_id}")
def get_stats(user_id: str):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM trip_stats WHERE user_id = %s", (user_id,))
            row = cursor.fetchone()
        conn.close()

        if not row:
            return {"stats": {"plannedTrips": 0, "totalDistance": 0.0, "totalEta": 0, "fuelUsed": 0.0, "fuelCost": 0.0, "bestSafetyScore": 98}}

        return {
            "stats": {
                "plannedTrips": int(row["planned_trips"]),
                "totalDistance": float(row["total_distance"]),
                "totalEta": int(row["total_eta"]),
                "fuelUsed": float(row["fuel_used"]),
                "fuelCost": float(row["fuel_cost"]),
                "bestSafetyScore": int(row["best_safety_score"])
            }
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch stats.")

@app.get("/api/trips/history/{user_id}")
def get_trip_history(user_id: str):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM trip_history WHERE user_id = %s ORDER BY created_at DESC LIMIT 50", (user_id,))
            rows = cursor.fetchall()
        conn.close()

        trips = [
            {
                "id": r["id"],
                "userId": r["user_id"],
                "sourceName": r["source_name"],
                "destinationName": r["destination_name"],
                "preferredRouteType": r["preferred_route_type"],
                "distanceKm": float(r["distance_km"]),
                "etaMinutes": int(r["eta_minutes"]),
                "fuelCost": float(r["fuel_cost"]),
                "safetyScore": int(r["safety_score"]),
                "createdAt": str(r["created_at"])
            }
            for r in rows
        ]
        return {"trips": trips}
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch trip history.")

@app.post("/api/trips/history", status_code=status.HTTP_201_CREATED)
def save_trip_history(data: TripHistoryRequest):
    trip_id = f"trip_{int(time.time() * 1000)}"
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                """INSERT INTO trip_history 
                   (id, user_id, source_name, destination_name, source_lat, source_lng, dest_lat, dest_lng, preferred_route_type, distance_km, eta_minutes, fuel_cost, safety_score)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (
                    trip_id,
                    data.userId or "usr_default_01",
                    data.sourceName,
                    data.destinationName,
                    data.sourceLat,
                    data.sourceLng,
                    data.destLat,
                    data.destLng,
                    data.preferredRouteType,
                    data.distanceKm,
                    data.etaMinutes,
                    data.fuelCost,
                    data.safetyScore
                )
            )

            cursor.execute(
                """UPDATE trip_stats 
                   SET planned_trips = planned_trips + 1,
                       total_distance = total_distance + %s,
                       total_eta = total_eta + %s,
                       fuel_cost = fuel_cost + %s
                   WHERE user_id = %s""",
                (data.distanceKm, data.etaMinutes, data.fuelCost, data.userId or "usr_default_01")
            )
        conn.close()
        return {"tripId": trip_id, "message": "Trip saved to history."}
    except Exception as e:
        print(f"[Save Trip Error] {e}")
        raise HTTPException(status_code=500, detail="Failed to save trip history.")

# ─── Chat History ───────────────────────────────────────────────────────────

@app.get("/api/chat/history/{user_id}")
def get_chat_history(user_id: str):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM chat_messages WHERE user_id = %s ORDER BY created_at ASC", (user_id,))
            rows = cursor.fetchall()
        conn.close()

        messages = [
            {
                "id": r["id"],
                "role": r["role"],
                "content": r["content"],
                "timestamp": int(r["created_at"])
            }
            for r in rows
        ]
        return {"messages": messages}
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch chat history.")

@app.post("/api/chat/history", status_code=status.HTTP_201_CREATED)
def save_chat_message(data: ChatMessageRequest):
    msg_id = f"msg_{int(time.time() * 1000)}"
    msg_time = data.timestamp or int(time.time() * 1000)

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO chat_messages (id, user_id, role, content, created_at) VALUES (%s, %s, %s, %s, %s)",
                (msg_id, data.userId or "usr_default_01", data.role, data.content, msg_time)
            )
        conn.close()
        return {"id": msg_id, "message": "Chat message saved."}
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to save chat message.")

@app.delete("/api/chat/history/{user_id}")
def clear_chat_history(user_id: str):
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM chat_messages WHERE user_id = %s", (user_id,))
        conn.close()
        return {"message": "Chat history cleared."}
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to clear chat history.")
