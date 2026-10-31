import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.question import QuestionOut


class InterviewCreate(BaseModel):
    target_role: str = Field(..., min_length=2, max_length=100)
    experience_level: str = Field(..., min_length=2, max_length=50)
    difficulty: str = Field(..., min_length=2, max_length=50)
    focus_topics: list[str] = Field(default_factory=list)
    question_count: int = Field(default=5, ge=3, le=10)
    job_description: str | None = Field(default=None, max_length=5000)

    @field_validator("experience_level")
    @classmethod
    def validate_experience_level(cls, v: str) -> str:
        valid = ["beginner", "intermediate", "advanced"]
        if v.lower() not in valid:
            raise ValueError(f"experience_level must be one of: {', '.join(valid)}")
        return v.capitalize()

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, v: str) -> str:
        valid = ["easy", "medium", "hard", "mixed"]
        if v.lower() not in valid:
            raise ValueError(f"difficulty must be one of: {', '.join(valid)}")
        return v.capitalize()


class InterviewUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)


class InterviewOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    target_role: str
    experience_level: str
    difficulty: str
    focus_topics: list[str]
    question_count: int
    status: str
    overall_score: float | None = None
    error_code: str | None = None
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InterviewDetailOut(InterviewOut):
    questions: list[QuestionOut] = []


class InterviewListResponse(BaseModel):
    items: list[InterviewOut]
    total: int
    limit: int
    offset: int
