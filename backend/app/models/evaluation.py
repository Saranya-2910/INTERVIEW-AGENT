import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    answer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("answers.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )

    technical_correctness: Mapped[float] = mapped_column(Float, nullable=False)  # 0 to 4
    completeness: Mapped[float] = mapped_column(Float, nullable=False)  # 0 to 2
    reasoning: Mapped[float] = mapped_column(Float, nullable=False)  # 0 to 2
    relevance_clarity: Mapped[float] = mapped_column(Float, nullable=False)  # 0 to 2
    total_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0 to 10

    strengths: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    missing_points: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    improvement_suggestion: Mapped[str] = mapped_column(Text, nullable=False)
    revision_topics: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    example_answer: Mapped[str | None] = mapped_column(Text, nullable=True)

    rubric_version: Mapped[str] = mapped_column(String(32), default="v1.0", nullable=False)
    model_name: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    answer: Mapped["Answer"] = relationship("Answer", back_populates="evaluation")
