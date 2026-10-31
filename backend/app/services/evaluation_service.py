import logging
import uuid

from sqlalchemy.orm import Session

from app.ai.gemini_client import BaseGeminiService, get_ai_service
from app.core.exceptions import (
    InvalidStateTransitionException,
    NotFoundException,
)
from app.models.interview import Interview
from app.repositories.interviews import InterviewRepository

logger = logging.getLogger(__name__)


class EvaluationService:
    def __init__(self, db: Session, ai_service: BaseGeminiService | None = None):
        self.db = db
        self.repo = InterviewRepository(db)
        self.ai_service = ai_service or get_ai_service()

    def evaluate_interview(self, interview_id: uuid.UUID, user_id: uuid.UUID) -> Interview:
        interview = self.repo.get_by_id(interview_id, user_id=user_id)
        if not interview:
            raise NotFoundException("Interview session not found")

        # Idempotency check: if already completed, return directly
        if interview.status == "completed":
            return interview

        if interview.status not in ("in_progress", "evaluating", "failed"):
            raise InvalidStateTransitionException("Interview must be in progress to evaluate")

        # Mark as evaluating
        self.repo.update_status(interview, "evaluating")

        scores = []
        try:
            for question in interview.questions:
                # Retrieve or create answer
                answer = question.answer
                if not answer:
                    answer = self.repo.get_or_create_answer(question.id, user_id)

                candidate_text = answer.answer_text or ""
                # Evaluate via AI Service
                eval_res = self.ai_service.evaluate_answer(
                    question_text=question.question_text,
                    topic=question.topic,
                    difficulty=question.difficulty,
                    reference_answer=question.reference_answer,
                    candidate_answer=candidate_text,
                )

                # Total score computed server-side
                calculated_total = round(
                    eval_res.technical_correctness
                    + eval_res.completeness
                    + eval_res.reasoning
                    + eval_res.relevance_clarity,
                    2,
                )

                # Save evaluation
                self.repo.save_evaluation(
                    answer_id=answer.id,
                    technical_correctness=eval_res.technical_correctness,
                    completeness=eval_res.completeness,
                    reasoning=eval_res.reasoning,
                    relevance_clarity=eval_res.relevance_clarity,
                    total_score=calculated_total,
                    strengths=eval_res.strengths,
                    missing_points=eval_res.missing_points,
                    improvement_suggestion=eval_res.improvement_suggestion,
                    revision_topics=eval_res.revision_topics,
                    example_answer=eval_res.example_answer,
                    model_name=getattr(self.ai_service, "model_name", "mock-evaluator"),
                )

                # Mark answer as evaluated
                self.repo.save_answer(answer, candidate_text, is_submitted=True)
                answer.status = "evaluated"
                self.db.commit()

                scores.append(calculated_total)

            # Calculate overall interview score
            overall_score = round(sum(scores) / len(scores), 2) if scores else 0.0
            interview = self.repo.update_status(interview, "completed", overall_score=overall_score)
            return interview

        except Exception as exc:
            logger.error("Error evaluating interview %s: %s", interview_id, exc)
            self.repo.update_status(interview, "failed", error_code="EVALUATION_FAILED")
            raise exc
