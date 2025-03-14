from fastapi import APIRouter

from app.api.endpoints import auth, health, llm, text

api_router = APIRouter()

# Include routers from endpoints
api_router.include_router(auth.router)  # Auth router already has prefix and tags
api_router.include_router(llm.router, tags=["llm"])
api_router.include_router(text.router, tags=["text"])
api_router.include_router(health.router, tags=["health"])
