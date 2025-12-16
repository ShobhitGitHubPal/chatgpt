from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from typing import List
import uvicorn
import ollama
import os
from pymongo import MongoClient
from passlib.context import CryptContext
import jwt

# ==============================
# CONFIG + MONGODB
# ==============================
MONGO_URL = "mongodb://localhost:27017"
client = MongoClient(MONGO_URL)
db = client["ai_verse"]
users = db["users"]

SECRET_KEY = "MYSECRET"
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# ==============================
# AUTH HELPERS
# ==============================
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=60))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)


def get_password_hash(password):
    return pwd_context.hash(password)


def verify_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


# ==============================
# USER DEPENDENCIES
# ==============================
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_token(credentials.credentials)

    user = users.find_one({"username": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


async def get_current_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    return user


# ==============================
# ROUTES
# ==============================

@app.post("/signup")
async def signup(username: str, email: str, full_name: str, password: str):
    if users.find_one({"username": username}):
        raise HTTPException(400, "User already exists")

    hashed_pw = get_password_hash(password)

    new_user = {
        "username": username,
        "email": email,
        "full_name": full_name,
        "password": hashed_pw,
        "role": "user",
        "disabled": False,
        "created_at": datetime.utcnow()
    }

    users.insert_one(new_user)

    token = create_access_token({"sub": username})

    return {"access_token": token, "user": new_user}


@app.post("/login")
async def login(username: str, password: str):
    user = users.find_one({"username": username})

    if not user or not verify_password(password, user["password"]):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token({"sub": username})

    return {"access_token": token, "user": user}


@app.get("/users/me")
async def me(user=Depends(get_current_user)):
    return user


@app.get("/admin/users")
async def get_all_users(admin=Depends(get_current_admin)):
    return list(users.find())


# ==============================
# OLLAMA CHAT ROUTE
# ==============================
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
print(OLLAMA_HOST,"eerifefefi")

@app.get("/chat")
async def chat(query: str):
    client = ollama.Client(host=OLLAMA_HOST)

    def stream():
        response = client.chat(
            model="mistral",
            messages=[{"role": "user", "content": query}],
            stream=True
        )
        for chunk in response:
            if "message" in chunk:
                yield chunk["message"]["content"]

    return StreamingResponse(stream(), media_type="text/plain")


# ==============================
# HEALTH CHECK
# ==============================
@app.get("/")
def home():
    return {"message": "AI Verse API running"}

@app.get("/health")
def health():
    return {"status": "healthy", "time": datetime.utcnow()}


# ======================================
# MAIN (when run locally)
# ======================================
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)