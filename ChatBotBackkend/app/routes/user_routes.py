from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from common.auth_setup import verify_token
from common.db_config import users_collection

security = HTTPBearer()
user_router = APIRouter(prefix="/users", tags=["Users"])


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_token(credentials.credentials)

    user = users_collection.find_one({"username": payload["sub"]})
    if not user:
        raise HTTPException(401, "User not found")

    return user


@user_router.get("/me")
async def me(user=Depends(get_current_user)):
    return user
