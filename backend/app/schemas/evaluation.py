import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EvaluationOut(BaseModel):
    id: uuid.UUID
    answer_id: uuid.UUID
    technical_correctness: float = Field(..., ge=0.0, le=4.0)
    completeness: float = Field(..., ge=0.0, le=2.0)
    reasoning: float = Field(..., ge=0.0, le=2.0)
    relevance_clarity: float = Field(..., ge=0.0, le=2.0)
    total_score: float = Field(..., ge=0.0, le=10.0)
    strengths: list[str]
    missing_points: list[str]
    improvement_suggestion: str
    revision_topics: list[str]
    example_answer: str | None = None
    rubric_version: str
    model_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
