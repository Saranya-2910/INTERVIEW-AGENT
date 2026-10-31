# AI Interview Agent 2.0 - Architecture Design

## 1. High-Level Architecture Overview

AI Interview Agent 2.0 is built as a modular monolithic backend with a decoupled modern React Single Page Application (SPA).

```
                      +---------------------------------------+
                      |             Browser Client            |
                      |   React 18 + TypeScript + Vite + Tailwind   |
                      |   TanStack Query + React Hook Form    |
                      +-------------------+-------------------+
                                          |
                                   REST / JSON (v1)
                                   (Bearer JWT / Auth)
                                          |
                                          v
+---------------------------------------------------------------------------------+
|                               FastAPI Backend (v1)                              |
|                                                                                 |
|  +------------------+  +-------------------+  +------------------+  +---------+ |
|  |   Auth Router    |  | Interview Router  |  | Evaluator Router |  | Analytics| |
|  +--------+---------+  +---------+---------+  +--------+---------+  +----+----+ |
|           |                      |                     |                 |      |
|           v                      v                     v                 v      |
|  +------------------+  +-------------------+  +------------------+  +---------+ |
|  |   Auth Service   |  | Interview Service |  | Evaluation Svc   |  | Analytics| |
|  +--------+---------+  +---------+---------+  +--------+---------+  +----+----+ |
|           |                      |                     |                 |      |
|           |                      +----------+----------+                 |      |
|           |                                 |                            |      |
|           |                                 v                            |      |
|           |                    +-------------------------+               |      |
|           |                    |   Gemini AI Client      |               |      |
|           |                    |  (google-genai SDK)     |               |      |
|           |                    |  Pydantic JSON parsing  |               |      |
|           |                    +------------+------------+               |      |
|           |                                 | (External GenAI)           |      |
|           v                                 v                            v      |
|  +----------------------------------------------------------------------------+ |
|  |                      SQLAlchemy 2.x ORM / Repositories                     | |
|  +----------------------------------------------------------------------------+ |
+----------------------------------------+----------------------------------------+
                                         |
                                         v
                         +-------------------------------+
                         |      PostgreSQL Database      |
                         |   (or local SQLite for dev)   |
                         +-------------------------------+
```

## 2. Core Architectural Layers

1. **API Router Layer (`app/api/v1/`)**:
   - Handles HTTP endpoints, query parameters, path arguments, and deserializes via Pydantic v2.
   - Enforces authentication dependencies and ownership verification.
   - Converts domain exceptions to standardized JSON error responses.

2. **Service Layer (`app/services/`)**:
   - Implements business logic: interview state machines, evaluation calculations, prompt construction, and analytics rollups.
   - Never trusts client-supplied scores, roles, or ownership IDs.

3. **AI Layer (`app/ai/`)**:
   - Wraps the official `google-genai` SDK.
   - Defines strict Pydantic models for structured question generation and structured evaluations.
   - Implements prompt injection safeguards by demarcating candidate answers and job descriptions strictly as data.
   - Provides a `MockGeminiClient` for deterministic, zero-cost, zero-network unit/integration tests.

4. **Persistence Layer (`app/models/`, `app/repositories/`, `app/db/`)**:
   - SQLAlchemy 2.0 ORM models using UUID primary keys and UTC timestamps.
   - Alembic migration scripts.
   - PostgreSQL in production/Docker, with SQLite fallback support for zero-dependency local development and testing.

## 3. Database Schema

- **`users`**: `id`, `name`, `email`, `password_hash`, `is_active`, `created_at`, `updated_at`.
- **`interviews`**: `id`, `user_id`, `title`, `target_role`, `experience_level`, `difficulty`, `focus_topics`, `question_count`, `status`, `overall_score`, `created_at`, `started_at`, `completed_at`, `updated_at`.
- **`questions`**: `id`, `interview_id`, `position`, `question_text`, `question_type`, `topic`, `difficulty`, `reference_answer`, `evaluation_criteria`, `created_at`.
- **`answers`**: `id`, `question_id`, `user_id`, `answer_text`, `status`, `submitted_at`, `created_at`, `updated_at`.
- **`evaluations`**: `id`, `answer_id`, `technical_correctness`, `completeness`, `reasoning`, `relevance_clarity`, `total_score`, `strengths`, `missing_points`, `improvement_suggestion`, `revision_topics`, `example_answer`, `rubric_version`, `model_name`, `created_at`.
