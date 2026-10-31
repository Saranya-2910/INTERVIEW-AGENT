import uuid

from sqlalchemy import desc, select
from sqlalchemy.orm import Session, selectinload

from app.models.answer import Answer
from app.models.interview import Interview
from app.models.question import Question
from app.schemas.analytics import (
    AnalyticsSummaryOut,
    ProgressAnalyticsOut,
    ProgressDataPoint,
    TopicAnalyticsOut,
    TopicMetric,
)


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_summary(self, user_id: uuid.UUID) -> AnalyticsSummaryOut:
        stmt = (
            select(Interview)
            .where(Interview.user_id == user_id)
            .options(
                selectinload(Interview.questions)
                .selectinload(Question.answer)
                .selectinload(Answer.evaluation)
            )
            .order_by(desc(Interview.created_at))
        )
        interviews = list(self.db.scalars(stmt).all())

        total = len(interviews)
        completed = [
            i for i in interviews if i.status == "completed" and i.overall_score is not None
        ]
        in_progress = [i for i in interviews if i.status == "in_progress"]

        completed_count = len(completed)
        in_progress_count = len(in_progress)

        avg_score = None
        latest_score = None
        if completed:
            avg_score = round(sum(i.overall_score for i in completed) / completed_count, 2)
            latest_score = completed[0].overall_score

        topic_counts: dict[str, list[float]] = {}
        all_strengths = []
        all_revisions = []

        for interview in completed:
            for q in interview.questions:
                if q.answer and q.answer.evaluation:
                    eval_rec = q.answer.evaluation
                    topic_counts.setdefault(q.topic, []).append(eval_rec.total_score)
                    all_strengths.extend(eval_rec.strengths or [])
                    all_revisions.extend(eval_rec.revision_topics or [])

        most_practiced: list[TopicMetric] = []
        for topic, scores in topic_counts.items():
            topic_avg = round(sum(scores) / len(scores), 2) if scores else None
            most_practiced.append(
                TopicMetric(
                    topic=topic,
                    practice_count=len(scores),
                    average_score=topic_avg,
                )
            )
        most_practiced.sort(key=lambda x: x.practice_count, reverse=True)

        top_strengths = list(dict.fromkeys(all_strengths))[:4]
        top_revisions = list(dict.fromkeys(all_revisions))[:4]

        return AnalyticsSummaryOut(
            total_interviews=total,
            completed_interviews=completed_count,
            in_progress_interviews=in_progress_count,
            average_score=avg_score,
            latest_score=latest_score,
            top_strengths=top_strengths,
            top_revision_topics=top_revisions,
            most_practiced_topics=most_practiced[:5],
        )

    def get_topics(self, user_id: uuid.UUID) -> TopicAnalyticsOut:
        stmt = (
            select(Interview)
            .where(Interview.user_id == user_id, Interview.status == "completed")
            .options(
                selectinload(Interview.questions)
                .selectinload(Question.answer)
                .selectinload(Answer.evaluation)
            )
        )
        interviews = list(self.db.scalars(stmt).all())

        topic_data: dict[str, list[float]] = {}
        for i in interviews:
            for q in i.questions:
                if q.answer and q.answer.evaluation:
                    topic_data.setdefault(q.topic, []).append(q.answer.evaluation.total_score)

        metrics = []
        for topic, scores in topic_data.items():
            avg_score = round(sum(scores) / len(scores), 2) if scores else None
            metrics.append(
                TopicMetric(
                    topic=topic,
                    practice_count=len(scores),
                    average_score=avg_score,
                )
            )
        metrics.sort(key=lambda x: x.average_score or 0.0, reverse=True)
        return TopicAnalyticsOut(topics=metrics)

    def get_progress(self, user_id: uuid.UUID) -> ProgressAnalyticsOut:
        stmt = (
            select(Interview)
            .where(
                Interview.user_id == user_id,
                Interview.status == "completed",
                Interview.overall_score.isnot(None),
            )
            .order_by(Interview.created_at.asc())
        )
        interviews = list(self.db.scalars(stmt).all())

        points = [
            ProgressDataPoint(
                interview_id=i.id,
                title=i.title,
                target_role=i.target_role,
                date=i.completed_at or i.created_at,
                score=i.overall_score or 0.0,
            )
            for i in interviews
        ]
        return ProgressAnalyticsOut(points=points)
