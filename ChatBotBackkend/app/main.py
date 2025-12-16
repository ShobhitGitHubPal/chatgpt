from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from routes.auth_routes import auth_router
from routes.user_routes import user_router
from routes.admin_routes import admin_router
from routes.chat_routes import chat_router
from routes.health_routes import health_router


app = FastAPI(
    title="AI Verse API",
    version="1.0.0",
    description="Modular FastAPI backend for AI Verse platform"
)

# =========================================
# CORS SETTINGS
# =========================================
origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,     # change to specific origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================
# REGISTER ROUTES (Routers)
# =========================================
app.include_router(auth_router)      # /auth/*
app.include_router(user_router)      # /users/*
app.include_router(admin_router)     # /admin/*
app.include_router(chat_router)      # /chat/*
app.include_router(health_router)    # /health/*


# =========================================
# MAIN ENTRY POINT
# =========================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

