import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AnswerDraftSave(BaseModel):
    answer_text: str = Field(..., max_length=10000)


class AnswerSubmit(BaseModel):
    answer_text: str = Field(..., max_length=10000)


class AnswerOut(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    user_id: uuid.UUID
    answer_text: str
    status: str
    submitted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
