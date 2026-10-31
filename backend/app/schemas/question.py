import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class QuestionBase(BaseModel):
    position: int
    question_text: str
    question_type: str = "conceptual"
    topic: str
    difficulty: str


class QuestionOut(QuestionBase):
    id: uuid.UUID
    interview_id: uuid.UUID
    created_at: datetime
    # Note: reference_answer is deliberately omitted from QuestionOut for security/integrity!

    model_config = ConfigDict(from_attributes=True)


class QuestionWithAnswerOut(QuestionOut):
    answer_text: str | None = None
    answer_status: str | None = None
    submitted_at: datetime | None = None
