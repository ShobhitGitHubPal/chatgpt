import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = "ai_verse"

SECRET_KEY = os.getenv("SECRET_KEY", "MYSECRET")
ALGORITHM = "HS256"

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://host.docker.internal:11434")
