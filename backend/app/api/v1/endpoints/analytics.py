from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.analytics import AnalyticsSummaryOut, ProgressAnalyticsOut, TopicAnalyticsOut
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary", response_model=AnalyticsSummaryOut)
def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AnalyticsService(db)
    return service.get_summary(current_user.id)


@router.get("/topics", response_model=TopicAnalyticsOut)
def get_topic_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AnalyticsService(db)
    return service.get_topics(current_user.id)


@router.get("/progress", response_model=ProgressAnalyticsOut)
def get_progress_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AnalyticsService(db)
    return service.get_progress(current_user.id)
