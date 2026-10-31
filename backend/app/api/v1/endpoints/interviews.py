import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.answer import AnswerDraftSave, AnswerOut, AnswerSubmit
from app.schemas.interview import (
    InterviewCreate,
    InterviewDetailOut,
    InterviewListResponse,
    InterviewOut,
    InterviewUpdate,
)
from app.schemas.question import QuestionWithAnswerOut
from app.schemas.report import InterviewReportOut
from app.services.evaluation_service import EvaluationService
from app.services.interview_service import InterviewService
from app.services.report_service import ReportService

router = APIRouter(prefix="/interviews", tags=["Interviews"])


@router.post("", response_model=InterviewDetailOut, status_code=status.HTTP_201_CREATED)
def create_interview(
    req: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InterviewService(db)
    interview = service.create_interview_and_generate_questions(
        user_id=current_user.id,
        target_role=req.target_role,
        experience_level=req.experience_level,
        difficulty=req.difficulty,
        focus_topics=req.focus_topics,
        question_count=req.question_count,
        job_description=req.job_description,
    )
    return interview


@router.get("", response_model=InterviewListResponse)
def list_interviews(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: str | None = Query(None),
    role: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InterviewService(db)
    items, total = service.list_interviews(
        user_id=current_user.id,
        limit=limit,
        offset=offset,
        status=status,
        role=role,
    )
    return InterviewListResponse(
        items=[InterviewOut.model_validate(i) for i in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{interview_id}")
def get_interview(
    interview_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InterviewService(db)
    interview = service.get_interview(interview_id, user_id=current_user.id)

    # Map questions with user's answer state, hiding reference answer
    questions_out = []
    for q in interview.questions:
        ans = q.answer
        questions_out.append(
            QuestionWithAnswerOut(
                id=q.id,
                interview_id=q.interview_id,
                position=q.position,
                question_text=q.question_text,
                question_type=q.question_type,
                topic=q.topic,
                difficulty=q.difficulty,
                created_at=q.created_at,
                answer_text=ans.answer_text if ans else "",
                answer_status=ans.status if ans else "unanswered",
                submitted_at=ans.submitted_at if ans else None,
            )
        )

    return {
        "id": interview.id,
        "user_id": interview.user_id,
        "title": interview.title,
        "target_role": interview.target_role,
        "experience_level": interview.experience_level,
        "difficulty": interview.difficulty,
        "focus_topics": interview.focus_topics,
        "question_count": interview.question_count,
        "status": interview.status,
        "overall_score": interview.overall_score,
        "error_code": interview.error_code,
        "created_at": interview.created_at,
        "started_at": interview.started_at,
        "completed_at": interview.completed_at,
        "updated_at": interview.updated_at,
        "questions": questions_out,
    }


@router.patch("/{interview_id}", response_model=InterviewOut)
def update_interview_metadata(
    interview_id: uuid.UUID,
    req: InterviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InterviewService(db)
    if req.title:
        return service.update_title(interview_id, current_user.id, req.title)
    return service.get_interview(interview_id, current_user.id)


@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview(
    interview_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InterviewService(db)
    service.delete_interview(interview_id, current_user.id)


@router.put("/{interview_id}/questions/{question_id}/answer", response_model=AnswerOut)
def save_draft_answer(
    interview_id: uuid.UUID,
    question_id: uuid.UUID,
    req: AnswerDraftSave,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InterviewService(db)
    answer = service.save_draft_answer(
        interview_id=interview_id,
        question_id=question_id,
        user_id=current_user.id,
        answer_text=req.answer_text,
    )
    return AnswerOut.model_validate(answer)


@router.post("/{interview_id}/questions/{question_id}/submit", response_model=AnswerOut)
def submit_answer(
    interview_id: uuid.UUID,
    question_id: uuid.UUID,
    req: AnswerSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InterviewService(db)
    answer = service.submit_answer(
        interview_id=interview_id,
        question_id=question_id,
        user_id=current_user.id,
        answer_text=req.answer_text,
    )
    return AnswerOut.model_validate(answer)


@router.post("/{interview_id}/evaluate", response_model=InterviewReportOut)
def evaluate_interview(
    interview_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    eval_service = EvaluationService(db)
    eval_service.evaluate_interview(interview_id=interview_id, user_id=current_user.id)

    report_service = ReportService(db)
    return report_service.get_interview_report(interview_id=interview_id, user_id=current_user.id)


@router.get("/{interview_id}/report", response_model=InterviewReportOut)
def get_interview_report(
    interview_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report_service = ReportService(db)
    return report_service.get_interview_report(interview_id=interview_id, user_id=current_user.id)
