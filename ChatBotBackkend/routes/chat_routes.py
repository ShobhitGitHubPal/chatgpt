from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import ollama
from core.config import OLLAMA_HOST

router = APIRouter(tags=["Chat"])

@router.get("/chat")
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
