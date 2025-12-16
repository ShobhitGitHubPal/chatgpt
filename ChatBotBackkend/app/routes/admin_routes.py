from fastapi import APIRouter, Depends, HTTPException
from common.db_config import users_collection
from routes.user_routes import get_current_user

admin_router = APIRouter(prefix="/admin", tags=["Admin"])


async def get_current_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Admin only")
    return user


@admin_router.get("/users")
async def get_all_users(admin=Depends(get_current_admin)):
    return list(users_collection.find())
