import uuid

from sqlalchemy.orm import Session

from app.ai.gemini_client import BaseGeminiService, get_ai_service
from app.core.exceptions import (
    InvalidStateTransitionException,
    NotFoundException,
)
from app.models.answer import Answer
from app.models.interview import Interview
from app.repositories.interviews import InterviewRepository


class InterviewService:
    def __init__(self, db: Session, ai_service: BaseGeminiService | None = None):
        self.db = db
        self.repo = InterviewRepository(db)
        self.ai_service = ai_service or get_ai_service()

    def create_interview_and_generate_questions(
        self,
        user_id: uuid.UUID,
        target_role: str,
        experience_level: str,
        difficulty: str,
        focus_topics: list[str],
        question_count: int,
        job_description: str | None = None,
    ) -> Interview:
        # Create initial draft/generating record
        interview = self.repo.create(
            user_id=user_id,
            title=f"{target_role} Interview ({experience_level})",
            target_role=target_role,
            experience_level=experience_level,
            difficulty=difficulty,
            focus_topics=focus_topics,
            question_count=question_count,
            status="generating",
        )

        try:
            # Generate questions via Gemini
            gen_response = self.ai_service.generate_questions(
                target_role=target_role,
                experience_level=experience_level,
                difficulty=difficulty,
                focus_topics=focus_topics,
                question_count=question_count,
                job_description=job_description,
            )

            # Persist questions in database
            questions_data = [
                {
                    "position": q.position,
                    "question_text": q.question_text,
                    "question_type": q.question_type,
                    "topic": q.topic,
                    "difficulty": q.difficulty,
                    "reference_answer": q.reference_answer,
                    "evaluation_criteria": q.evaluation_criteria,
                }
                for q in gen_response.questions
            ]
            self.repo.create_questions(interview.id, questions_data)

            # Update interview title and status to in_progress
            if gen_response.title:
                self.repo.update_title(interview, gen_response.title)
            interview = self.repo.update_status(interview, "in_progress")
            return self.get_interview(interview.id, user_id=user_id)

        except Exception as exc:
            self.repo.update_status(interview, "failed", error_code="GENERATION_FAILED")
            raise exc

    def list_interviews(
        self,
        user_id: uuid.UUID,
        limit: int = 20,
        offset: int = 0,
        status: str | None = None,
        role: str | None = None,
    ) -> tuple[list[Interview], int]:
        return self.repo.list_by_user(
            user_id=user_id, limit=limit, offset=offset, status=status, role=role
        )

    def get_interview(self, interview_id: uuid.UUID, user_id: uuid.UUID) -> Interview:
        interview = self.repo.get_by_id(interview_id)
        if not interview:
            raise NotFoundException("Interview session not found")
        if interview.user_id != user_id:
            # Avoid leaking resource existence by raising 404 or 403
            raise NotFoundException("Interview session not found")
        return interview

    def update_title(self, interview_id: uuid.UUID, user_id: uuid.UUID, title: str) -> Interview:
        interview = self.get_interview(interview_id, user_id)
        return self.repo.update_title(interview, title)

    def delete_interview(self, interview_id: uuid.UUID, user_id: uuid.UUID) -> None:
        interview = self.get_interview(interview_id, user_id)
        self.repo.delete(interview)

    def save_draft_answer(
        self,
        interview_id: uuid.UUID,
        question_id: uuid.UUID,
        user_id: uuid.UUID,
        answer_text: str,
    ) -> Answer:
        interview = self.get_interview(interview_id, user_id)
        if interview.status not in ("in_progress", "draft"):
            raise InvalidStateTransitionException(
                "Cannot edit answers in an interview that is not in progress"
            )

        question = self.repo.get_question_by_id(question_id, interview_id=interview_id)
        if not question:
            raise NotFoundException("Question not found in this interview")

        answer = self.repo.get_or_create_answer(question_id, user_id)
        return self.repo.save_answer(answer, answer_text, is_submitted=False)

    def submit_answer(
        self,
        interview_id: uuid.UUID,
        question_id: uuid.UUID,
        user_id: uuid.UUID,
        answer_text: str,
    ) -> Answer:
        interview = self.get_interview(interview_id, user_id)
        if interview.status not in ("in_progress", "draft"):
            raise InvalidStateTransitionException(
                "Cannot submit answers for an interview that is not in progress"
            )

        question = self.repo.get_question_by_id(question_id, interview_id=interview_id)
        if not question:
            raise NotFoundException("Question not found in this interview")

        answer = self.repo.get_or_create_answer(question_id, user_id)
        return self.repo.save_answer(answer, answer_text, is_submitted=True)
