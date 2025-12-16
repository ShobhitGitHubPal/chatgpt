from fastapi import APIRouter
from datetime import datetime

health_router = APIRouter(tags=["Health"])


@health_router.get("/")
def root():
    return {"message": "AI Verse API running"}


@health_router.get("/health")
def health():
    return {"status": "healthy", "time": datetime.utcnow()}
