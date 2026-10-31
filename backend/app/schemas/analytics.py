import uuid
from datetime import datetime

from pydantic import BaseModel


class TopicMetric(BaseModel):
    topic: str
    practice_count: int
    average_score: float | None = None


class ProgressDataPoint(BaseModel):
    interview_id: uuid.UUID
    title: str
    target_role: str
    date: datetime
    score: float


class AnalyticsSummaryOut(BaseModel):
    total_interviews: int
    completed_interviews: int
    in_progress_interviews: int
    average_score: float | None = None
    latest_score: float | None = None
    top_strengths: list[str] = []
    top_revision_topics: list[str] = []
    most_practiced_topics: list[TopicMetric] = []


class TopicAnalyticsOut(BaseModel):
    topics: list[TopicMetric]


class ProgressAnalyticsOut(BaseModel):
    points: list[ProgressDataPoint]
