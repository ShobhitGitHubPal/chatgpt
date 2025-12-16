from fastapi import APIRouter, HTTPException
from datetime import datetime
from models.user_model import SignupModel, LoginModel
from core.database import users_collection
from core.security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup")
async def signup(payload: SignupModel):

    if users_collection.find_one({
        "$or": [
            {"username": payload.username},
            {"email": payload.email}
        ]
    }):
        raise HTTPException(400, "Username or email already exists")

    user = {
        "username": payload.username,
        "email": payload.email,
        "full_name": payload.full_name,
        "password": get_password_hash(payload.password),
        "role": "user",
        "disabled": False,
        "created_at": datetime.utcnow()
    }

    users_collection.insert_one(user)

    token = create_access_token({"sub": payload.username})

    return {
        "token": token,
        "user": {
            "username": payload.username,
            "email": payload.email,
            "full_name": payload.full_name,
            "role": "user"
        }
    }


@router.post("/login")
async def login(payload: LoginModel):

    user = users_collection.find_one({"username": payload.username})

    if not user or not verify_password(payload.password, user["password"]):
        raise HTTPException(401, "Invalid username or password")

    token = create_access_token({"sub": payload.username})

    return {
        "token": token,
        "user": {
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }
