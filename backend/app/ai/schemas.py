from pydantic import BaseModel, Field


class GeneratedQuestion(BaseModel):
    position: int = Field(..., ge=1, le=10)
    question_text: str = Field(..., min_length=10)
    question_type: str = Field(
        "conceptual", description="conceptual, practical, debugging, scenario, or design"
    )
    topic: str = Field(..., min_length=2)
    difficulty: str = Field(..., description="easy, medium, hard")
    reference_answer: str = Field(
        ..., min_length=10, description="Concise reference answer for internal evaluation only"
    )
    evaluation_criteria: list[str] = Field(
        default_factory=list, description="Key criteria to look for"
    )


class QuestionGenerationResponse(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    questions: list[GeneratedQuestion] = Field(..., min_length=1, max_length=10)


class EvaluationResponse(BaseModel):
    technical_correctness: float = Field(..., ge=0.0, le=4.0, description="0 to 4 scale")
    completeness: float = Field(..., ge=0.0, le=2.0, description="0 to 2 scale")
    reasoning: float = Field(..., ge=0.0, le=2.0, description="0 to 2 scale")
    relevance_clarity: float = Field(..., ge=0.0, le=2.0, description="0 to 2 scale")
    strengths: list[str] = Field(default_factory=list)
    missing_points: list[str] = Field(default_factory=list)
    improvement_suggestion: str = Field(..., min_length=5)
    revision_topics: list[str] = Field(default_factory=list)
    example_answer: str | None = Field(
        None, description="Concise model answer illustrating improvements"
    )
