from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from common.db_config import users_collection
from common.auth_setup import (
    create_access_token,
    verify_password,
    get_password_hash,
)

auth_router = APIRouter(prefix="/auth", tags=["Auth"])
# auth_router=APIRouter()
# Pydantic models for request validation
class SignupRequest(BaseModel):
    username: str
    email: str
    full_name: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

@auth_router.post("/signup")
async def signup(request: SignupRequest):
    print('===============================')
    # Check if user already exists
    if users_collection.find_one({"username": request.username}):
        raise HTTPException(400, "User already exists")
    
    # Check if email already exists (optional)
    if users_collection.find_one({"email": request.email}):
        raise HTTPException(400, "Email already registered")

    hashed_pw = get_password_hash(request.password)

    new_user = {
        "username": request.username,
        "email": request.email,
        "full_name": request.full_name,
        "password": hashed_pw,
        "role": "user",
        "disabled": False,
        "created_at": datetime.utcnow()
    }

    users_collection.insert_one(new_user)
    token = create_access_token({"sub": request.username})

    # Remove password from response for security
    user_response = new_user.copy()
    user_response.pop("password", None)
    
    return {"access_token": token, "user": user_response}

@auth_router.post("/login")
async def login(request: LoginRequest):
    user = users_collection.find_one({"username": request.username})

    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token({"sub": request.username})
    
    # Remove password from response for security
    user_response = user.copy()
    user_response.pop("password", None)
    
    return {"access_token": token, "user": user_response}