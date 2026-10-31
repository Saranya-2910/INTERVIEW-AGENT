from fastapi import APIRouter

from app.api.v1.endpoints import analytics, auth, interviews

api_v1_router = APIRouter()

api_v1_router.include_router(auth.router)
api_v1_router.include_router(interviews.router)
api_v1_router.include_router(analytics.router)
