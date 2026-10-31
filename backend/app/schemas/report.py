import uuid
from datetime import datetime

from pydantic import BaseModel

from app.schemas.evaluation import EvaluationOut


class QuestionReportItem(BaseModel):
    question_id: uuid.UUID
    position: int
    question_text: str
    topic: str
    difficulty: str
    question_type: str
    reference_answer: str | None = None
    answer_text: str | None = None
    answer_status: str
    evaluation: EvaluationOut | None = None


class TopicScoreItem(BaseModel):
    topic: str
    average_score: float
    question_count: int


class InterviewReportOut(BaseModel):
    interview_id: uuid.UUID
    title: str
    target_role: str
    experience_level: str
    difficulty: str
    status: str
    overall_score: float | None = None
    created_at: datetime
    completed_at: datetime | None = None
    recommendation_label: str
    recommendation_reason: str
    disclaimer: str
    summary_strengths: list[str]
    summary_improvement_areas: list[str]
    recommended_revision_topics: list[str]
    practice_plan: list[str]
    topic_breakdown: list[TopicScoreItem]
    questions: list[QuestionReportItem]
