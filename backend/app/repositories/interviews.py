import uuid
from datetime import UTC, datetime

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session, selectinload

from app.models.answer import Answer
from app.models.evaluation import Evaluation
from app.models.interview import Interview
from app.models.question import Question


def utcnow() -> datetime:
    return datetime.now(UTC)


class InterviewRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        user_id: uuid.UUID,
        title: str,
        target_role: str,
        experience_level: str,
        difficulty: str,
        focus_topics: list,
        question_count: int,
        status: str = "generating",
    ) -> Interview:
        interview = Interview(
            user_id=user_id,
            title=title,
            target_role=target_role,
            experience_level=experience_level,
            difficulty=difficulty,
            focus_topics=focus_topics,
            question_count=question_count,
            status=status,
        )
        self.db.add(interview)
        self.db.commit()
        self.db.refresh(interview)
        return interview

    def get_by_id(
        self, interview_id: uuid.UUID, user_id: uuid.UUID | None = None
    ) -> Interview | None:
        stmt = (
            select(Interview)
            .where(Interview.id == interview_id)
            .options(
                selectinload(Interview.questions)
                .selectinload(Question.answer)
                .selectinload(Answer.evaluation)
            )
        )
        if user_id:
            stmt = stmt.where(Interview.user_id == user_id)
        return self.db.scalars(stmt).first()

    def list_by_user(
        self,
        user_id: uuid.UUID,
        limit: int = 20,
        offset: int = 0,
        status: str | None = None,
        role: str | None = None,
    ) -> tuple[list[Interview], int]:
        query = select(Interview).where(Interview.user_id == user_id)
        count_query = select(func.count(Interview.id)).where(Interview.user_id == user_id)

        if status:
            query = query.where(Interview.status == status)
            count_query = count_query.where(Interview.status == status)
        if role:
            query = query.where(Interview.target_role.ilike(f"%{role}%"))
            count_query = count_query.where(Interview.target_role.ilike(f"%{role}%"))

        total = self.db.scalar(count_query) or 0
        query = query.order_by(desc(Interview.created_at)).offset(offset).limit(limit)
        items = list(self.db.scalars(query).all())
        return items, total

    def update_status(
        self,
        interview: Interview,
        status: str,
        overall_score: float | None = None,
        error_code: str | None = None,
    ) -> Interview:
        interview.status = status
        if status == "in_progress" and not interview.started_at:
            interview.started_at = utcnow()
        elif status == "completed":
            interview.completed_at = utcnow()
        if overall_score is not None:
            interview.overall_score = overall_score
        if error_code is not None:
            interview.error_code = error_code
        interview.updated_at = utcnow()
        self.db.commit()
        self.db.refresh(interview)
        return interview

    def update_title(self, interview: Interview, title: str) -> Interview:
        interview.title = title
        interview.updated_at = utcnow()
        self.db.commit()
        self.db.refresh(interview)
        return interview

    def delete(self, interview: Interview) -> None:
        self.db.delete(interview)
        self.db.commit()

    # Questions
    def create_questions(
        self, interview_id: uuid.UUID, questions_data: list[dict]
    ) -> list[Question]:
        questions = []
        for q in questions_data:
            question = Question(
                interview_id=interview_id,
                position=q["position"],
                question_text=q["question_text"],
                question_type=q.get("question_type", "conceptual"),
                topic=q["topic"],
                difficulty=q["difficulty"],
                reference_answer=q.get("reference_answer"),
                evaluation_criteria=q.get("evaluation_criteria", []),
            )
            self.db.add(question)
            questions.append(question)
        self.db.commit()
        for q in questions:
            self.db.refresh(q)
        return questions

    def get_question_by_id(
        self, question_id: uuid.UUID, interview_id: uuid.UUID | None = None
    ) -> Question | None:
        stmt = (
            select(Question)
            .where(Question.id == question_id)
            .options(selectinload(Question.answer).selectinload(Answer.evaluation))
        )
        if interview_id:
            stmt = stmt.where(Question.interview_id == interview_id)
        return self.db.scalars(stmt).first()

    # Answers
    def get_or_create_answer(self, question_id: uuid.UUID, user_id: uuid.UUID) -> Answer:
        stmt = select(Answer).where(Answer.question_id == question_id, Answer.user_id == user_id)
        answer = self.db.scalars(stmt).first()
        if not answer:
            answer = Answer(
                question_id=question_id,
                user_id=user_id,
                answer_text="",
                status="draft",
            )
            self.db.add(answer)
            self.db.commit()
            self.db.refresh(answer)
        return answer

    def save_answer(self, answer: Answer, text: str, is_submitted: bool = False) -> Answer:
        answer.answer_text = text
        if is_submitted:
            answer.status = "submitted"
            answer.submitted_at = utcnow()
        else:
            answer.status = "draft"
        answer.updated_at = utcnow()
        self.db.commit()
        self.db.refresh(answer)
        return answer

    # Evaluations
    def save_evaluation(
        self,
        answer_id: uuid.UUID,
        technical_correctness: float,
        completeness: float,
        reasoning: float,
        relevance_clarity: float,
        total_score: float,
        strengths: list,
        missing_points: list,
        improvement_suggestion: str,
        revision_topics: list,
        example_answer: str | None,
        model_name: str,
        rubric_version: str = "v1.0",
    ) -> Evaluation:
        stmt = select(Evaluation).where(Evaluation.answer_id == answer_id)
        existing = self.db.scalars(stmt).first()
        if existing:
            existing.technical_correctness = technical_correctness
            existing.completeness = completeness
            existing.reasoning = reasoning
            existing.relevance_clarity = relevance_clarity
            existing.total_score = total_score
            existing.strengths = strengths
            existing.missing_points = missing_points
            existing.improvement_suggestion = improvement_suggestion
            existing.revision_topics = revision_topics
            existing.example_answer = example_answer
            existing.model_name = model_name
            existing.rubric_version = rubric_version
            self.db.commit()
            self.db.refresh(existing)
            return existing

        eval_record = Evaluation(
            answer_id=answer_id,
            technical_correctness=technical_correctness,
            completeness=completeness,
            reasoning=reasoning,
            relevance_clarity=relevance_clarity,
            total_score=total_score,
            strengths=strengths,
            missing_points=missing_points,
            improvement_suggestion=improvement_suggestion,
            revision_topics=revision_topics,
            example_answer=example_answer,
            rubric_version=rubric_version,
            model_name=model_name,
        )
        self.db.add(eval_record)
        self.db.commit()
        self.db.refresh(eval_record)
        return eval_record
