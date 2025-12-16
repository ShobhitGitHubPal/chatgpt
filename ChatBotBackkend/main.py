from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth_routes import router as auth_router
from routes.admin_routes import router as admin_router
from routes.chat_routes import router as chat_router

app = FastAPI(title="AI Verse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(chat_router)

@app.get("/")
def home():
    return {"message": "AI Verse API running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
