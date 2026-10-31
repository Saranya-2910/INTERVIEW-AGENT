import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import InvalidStateTransitionException, NotFoundException
from app.repositories.interviews import InterviewRepository
from app.schemas.evaluation import EvaluationOut
from app.schemas.report import InterviewReportOut, QuestionReportItem, TopicScoreItem


class ReportService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = InterviewRepository(db)

    def get_interview_report(
        self, interview_id: uuid.UUID, user_id: uuid.UUID
    ) -> InterviewReportOut:
        interview = self.repo.get_by_id(interview_id, user_id=user_id)
        if not interview:
            raise NotFoundException("Interview not found")

        if interview.status != "completed":
            raise InvalidStateTransitionException(
                "Report is not ready. The interview has not been evaluated yet."
            )

        question_reports: list[QuestionReportItem] = []
        all_strengths: list[str] = []
        all_missing: list[str] = []
        all_revision_topics: list[str] = []
        topic_scores: dict[str, list[float]] = {}

        for q in interview.questions:
            answer = q.answer
            eval_record = answer.evaluation if answer else None

            eval_out = None
            if eval_record:
                eval_out = EvaluationOut.model_validate(eval_record)
                all_strengths.extend(eval_record.strengths or [])
                all_missing.extend(eval_record.missing_points or [])
                all_revision_topics.extend(eval_record.revision_topics or [])

                topic_scores.setdefault(q.topic, []).append(eval_record.total_score)

            question_reports.append(
                QuestionReportItem(
                    question_id=q.id,
                    position=q.position,
                    question_text=q.question_text,
                    topic=q.topic,
                    difficulty=q.difficulty,
                    question_type=q.question_type,
                    reference_answer=q.reference_answer,
                    answer_text=answer.answer_text if answer else "",
                    answer_status=answer.status if answer else "unanswered",
                    evaluation=eval_out,
                )
            )

        # Topic Breakdown
        topic_breakdown: list[TopicScoreItem] = []
        for topic_name, scores in topic_scores.items():
            avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0
            topic_breakdown.append(
                TopicScoreItem(
                    topic=topic_name,
                    average_score=avg_score,
                    question_count=len(scores),
                )
            )
        topic_breakdown.sort(key=lambda x: x.average_score, reverse=True)

        # Recommendation and practice plan
        overall = interview.overall_score or 0.0
        if overall >= 8.0:
            rec_label = "Ready to practise harder questions"
            rec_reason = "Demonstrated strong technical command, clear explanation of trade-offs, and solid depth across tested topics."
            practice_plan = [
                "Practice advanced system design and architectural trade-offs.",
                "Deep-dive into performance edge cases and distributed systems questions.",
                "Refine time-management to keep answers concise without losing precision.",
            ]
        elif overall >= 5.0:
            rec_label = "Keep strengthening fundamentals"
            rec_reason = "Good foundational knowledge with correct terminology; expand on edge cases, failure scenarios, and performance trade-offs."
            practice_plan = [
                f"Review key concepts in: {', '.join(list(set(all_revision_topics))[:3]) if all_revision_topics else 'core role topics'}.",
                "Structure technical answers with: definition -> mechanism -> trade-offs -> practical example.",
                "Attempt a Medium-difficulty session focused on your lowest-scoring topics.",
            ]
        else:
            rec_label = "Review these topics and retry"
            rec_reason = "Noticed several gaps in technical accuracy and completeness. Focus revision on foundational concepts before retrying."
            practice_plan = [
                f"Prioritize study on: {', '.join(list(set(all_revision_topics))[:4]) if all_revision_topics else 'primary interview topics'}.",
                "Read the suggested reference answers and note standard industry terminology.",
                "Retry this role with 'Easy' difficulty to rebuild confidence.",
            ]

        # Deduplicate top strengths & improvement areas
        dedup_strengths = list(dict.fromkeys(all_strengths))[:4]
        dedup_missing = list(dict.fromkeys(all_missing))[:4]
        dedup_revision = list(dict.fromkeys(all_revision_topics))[:5]

        disclaimer = (
            "AI feedback is provided as practice guidance and can be imperfect. "
            "It does not represent an actual hiring decision. "
            "Use these insights to identify learning opportunities and strengthen your interview communication."
        )

        return InterviewReportOut(
            interview_id=interview.id,
            title=interview.title,
            target_role=interview.target_role,
            experience_level=interview.experience_level,
            difficulty=interview.difficulty,
            status=interview.status,
            overall_score=interview.overall_score,
            created_at=interview.created_at,
            completed_at=interview.completed_at,
            recommendation_label=rec_label,
            recommendation_reason=rec_reason,
            disclaimer=disclaimer,
            summary_strengths=dedup_strengths,
            summary_improvement_areas=dedup_missing,
            recommended_revision_topics=dedup_revision,
            practice_plan=practice_plan,
            topic_breakdown=topic_breakdown,
            questions=question_reports,
        )
