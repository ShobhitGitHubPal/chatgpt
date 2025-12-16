from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from core.security import verify_token
from core.database import users_collection

security = HTTPBearer()

async def get_current_user(credentials=Depends(security)):
    payload = verify_token(credentials.credentials)
    user = users_collection.find_one({"username": payload["sub"]})
    
    if not user:
        raise HTTPException(401, "User not found")

    return user

async def get_current_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Admin only")
    return user
