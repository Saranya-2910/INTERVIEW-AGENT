import logging

from pydantic import ValidationError

from app.ai.prompts import (
    EVALUATION_SYSTEM_PROMPT,
    QUESTION_GENERATION_SYSTEM_PROMPT,
    build_evaluation_prompt,
    build_question_generation_prompt,
)
from app.ai.schemas import EvaluationResponse, GeneratedQuestion, QuestionGenerationResponse
from app.core.config import settings
from app.core.exceptions import AIProviderException

logger = logging.getLogger(__name__)


class BaseGeminiService:
    def generate_questions(
        self,
        target_role: str,
        experience_level: str,
        difficulty: str,
        focus_topics: list,
        question_count: int,
        job_description: str | None = None,
    ) -> QuestionGenerationResponse:
        raise NotImplementedError

    def evaluate_answer(
        self,
        question_text: str,
        topic: str,
        difficulty: str,
        reference_answer: str | None,
        candidate_answer: str,
    ) -> EvaluationResponse:
        raise NotImplementedError


class MockGeminiService(BaseGeminiService):
    """Deterministic, zero-network mock service for tests and local development without active Gemini keys."""

    def generate_questions(
        self,
        target_role: str,
        experience_level: str,
        difficulty: str,
        focus_topics: list,
        question_count: int,
        job_description: str | None = None,
    ) -> QuestionGenerationResponse:
        topics = focus_topics or ["Python", "FastAPI", "Data Structures", "System Design", "SQL"]
        questions = []
        for i in range(1, question_count + 1):
            topic = topics[(i - 1) % len(topics)]
            questions.append(
                GeneratedQuestion(
                    position=i,
                    question_text=f"Explain how {topic} handles memory management, concurrency, and key performance trade-offs in a production environment.",
                    question_type="conceptual" if i % 2 == 1 else "practical",
                    topic=topic,
                    difficulty=difficulty.lower(),
                    reference_answer=f"A strong answer will explain core mechanics of {topic}, referencing concurrency models, performance bottlenecks, and best practices.",
                    evaluation_criteria=[
                        f"Demonstrates clear conceptual understanding of {topic}",
                        "Discusses trade-offs and performance implications",
                        "Provides concrete examples",
                    ],
                )
            )
        return QuestionGenerationResponse(
            title=f"{target_role} Practice Interview ({experience_level})",
            questions=questions,
        )

    def evaluate_answer(
        self,
        question_text: str,
        topic: str,
        difficulty: str,
        reference_answer: str | None,
        candidate_answer: str,
    ) -> EvaluationResponse:
        stripped = candidate_answer.strip()
        if not stripped or len(stripped) < 10:
            return EvaluationResponse(
                technical_correctness=0.0,
                completeness=0.0,
                reasoning=0.0,
                relevance_clarity=0.0,
                strengths=["Attempted to submit an answer"],
                missing_points=[
                    "No substantive answer provided or answer is too brief to evaluate"
                ],
                improvement_suggestion="Provide a complete, detailed response addressing the core mechanisms and trade-offs.",
                revision_topics=[topic, "Fundamental Concepts"],
                example_answer="An ideal response should define the core terminology, explain how the mechanism works step-by-step, and provide practical examples.",
            )

        # Basic length-based heuristic for mock responses
        word_count = len(stripped.split())
        tech_score = min(4.0, max(1.0, round(word_count / 25, 1)))
        comp_score = min(2.0, max(0.5, round(word_count / 40, 1)))
        reason_score = min(2.0, max(0.5, round(word_count / 50, 1)))
        rel_score = min(2.0, max(1.0, round(word_count / 30, 1)))

        return EvaluationResponse(
            technical_correctness=tech_score,
            completeness=comp_score,
            reasoning=reason_score,
            relevance_clarity=rel_score,
            strengths=[
                f"Demonstrated good awareness of {topic} principles",
                "Clear communication structure",
            ],
            missing_points=[
                "Could expand on edge cases and failure modes",
                "Deep-dive into production monitoring and telemetry trade-offs",
            ],
            improvement_suggestion=f"To elevate this answer, include concrete examples of how {topic} behaves under high load.",
            revision_topics=[topic, "Concurrency & Scale"],
            example_answer="A production-ready answer explains architecture choices, resource constraints, and error recovery strategies with illustrative code or benchmarks.",
        )


class GeminiService(BaseGeminiService):
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._client = None

    @property
    def client(self):
        if self._client is None:
            if not self.api_key:
                raise AIProviderException("Gemini API key is not configured.")
            try:
                from google import genai

                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error("Failed to initialize Google GenAI client: %s", e)
                raise AIProviderException("Failed to initialize Gemini AI client.")
        return self._client

    def generate_questions(
        self,
        target_role: str,
        experience_level: str,
        difficulty: str,
        focus_topics: list,
        question_count: int,
        job_description: str | None = None,
    ) -> QuestionGenerationResponse:
        from google.genai import types

        prompt = build_question_generation_prompt(
            target_role=target_role,
            experience_level=experience_level,
            difficulty=difficulty,
            focus_topics=focus_topics,
            question_count=question_count,
            job_description=job_description,
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=QUESTION_GENERATION_SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=QuestionGenerationResponse,
                    temperature=0.3,
                ),
            )
            parsed = QuestionGenerationResponse.model_validate_json(response.text)
            return parsed
        except (ValidationError, Exception) as exc:
            logger.warning("First attempt question generation failed: %s. Retrying once...", exc)
            try:
                # Retry once with structured request
                retry_response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                    + "\nEnsure you output strictly valid JSON according to schema.",
                    config=types.GenerateContentConfig(
                        system_instruction=QUESTION_GENERATION_SYSTEM_PROMPT,
                        response_mime_type="application/json",
                        response_schema=QuestionGenerationResponse,
                        temperature=0.2,
                    ),
                )
                return QuestionGenerationResponse.model_validate_json(retry_response.text)
            except Exception as retry_exc:
                logger.error("Question generation retry failed: %s", retry_exc)
                raise AIProviderException(
                    "Unable to generate interview questions. Please try again."
                )

    def evaluate_answer(
        self,
        question_text: str,
        topic: str,
        difficulty: str,
        reference_answer: str | None,
        candidate_answer: str,
    ) -> EvaluationResponse:
        # Check blank answer policy before invoking AI
        stripped = candidate_answer.strip()
        if not stripped:
            return EvaluationResponse(
                technical_correctness=0.0,
                completeness=0.0,
                reasoning=0.0,
                relevance_clarity=0.0,
                strengths=[],
                missing_points=["No answer was submitted for this question."],
                improvement_suggestion="Ensure you provide a response, even if partial, to demonstrate foundational understanding.",
                revision_topics=[topic],
                example_answer=reference_answer
                or "An ideal answer covers the key concepts, design trade-offs, and examples.",
            )

        from google.genai import types

        prompt = build_evaluation_prompt(
            question_text=question_text,
            topic=topic,
            difficulty=difficulty,
            reference_answer=reference_answer,
            candidate_answer=stripped,
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=EVALUATION_SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=EvaluationResponse,
                    temperature=0.2,
                ),
            )
            parsed = EvaluationResponse.model_validate_json(response.text)
            return parsed
        except Exception as exc:
            logger.warning("First attempt evaluation failed: %s. Retrying once...", exc)
            try:
                retry_response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                    + "\nEnsure output is strictly valid JSON conforming to the schema.",
                    config=types.GenerateContentConfig(
                        system_instruction=EVALUATION_SYSTEM_PROMPT,
                        response_mime_type="application/json",
                        response_schema=EvaluationResponse,
                        temperature=0.1,
                    ),
                )
                return EvaluationResponse.model_validate_json(retry_response.text)
            except Exception as retry_exc:
                logger.error("Answer evaluation failed: %s", retry_exc)
                raise AIProviderException("Failed to evaluate question answer. Please try again.")


def get_ai_service() -> BaseGeminiService:
    """Factory to get the appropriate AI service implementation."""
    if settings.APP_ENV == "testing":
        return MockGeminiService()
    key = settings.GEMINI_API_KEY
    if (
        not key
        or key.strip() in ("", "your_gemini_api_key_here", "mock_dev_key")
        or "mock" in key.lower()
        or "test" in key.lower()
    ):
        return MockGeminiService()
    return GeminiService()
