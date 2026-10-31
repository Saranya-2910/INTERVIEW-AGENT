# AI Interview Agent 2.0

> A production-minded, full-stack AI interview practice platform built from scratch with FastAPI, React, TypeScript, Tailwind CSS, PostgreSQL, and Google Gemini API (`google-genai`).

[![Backend Tests](https://img.shields.io/badge/pytest-14%20passed-emerald)](backend/app/tests)
[![Code Quality](https://img.shields.io/badge/ruff-passed-blue)](pyproject.toml)
[![Frontend Tests](https://img.shields.io/badge/vitest-passed-emerald)](frontend/src/tests)
[![Python](https://img.shields.io/badge/python-3.12+-blue)](backend)
[![TypeScript](https://img.shields.io/badge/typescript-5.5+-blue)](frontend)

---

## 1. Overview & Capabilities

**AI Interview Agent 2.0** provides candidates with realistic, technical interview simulations without claiming to replace human interviewers. It evaluates written engineering responses against a transparent, job-relevant **10-point rubric** and produces structured revision plans.

### Key Capabilities
- **Role-Specific Question Generation:** Tailored for Python Developers, Backend Engineers, Full-Stack Developers, Data Analysts, Data Scientists, ML Engineers, or Custom Roles.
- **Configurable Parameters:** Experience level (Beginner, Intermediate, Advanced), Difficulty (Easy, Medium, Hard, Mixed), and focus concepts with custom topic addition.
- **Transparent 0–10 Evaluation Rubric:**
  - Technical Correctness: 0 to 4
  - Completeness: 0 to 2
  - Reasoning & Trade-offs: 0 to 2
  - Relevance & Clarity: 0 to 2
- **Actionable Guidance & Practice Plans:** Specific strengths, missing points, revision topics, concrete improvement tips, and model benchmark answers.
- **Analytics & Progression:** Session history, score progression charts over time, topic mastery breakdowns with sample sizes.
- **Ethical & Secure by Design:**
  - Password hashing with **Argon2id**.
  - No facial recognition, emotion tracking, voice analysis, or speculative personality scoring.
  - Answers are persisted before AI grading so transient failures never lose candidate work.
  - Candidate text and job descriptions are demarcated as passive data blocks to prevent prompt injection.
  - Benchmark reference answers are never exposed to the client prior to answer submission.

---

## 2. Architecture & Technology Stack

```
                          +-------------------------------------+
                          |            React 18 (SPA)           |
                          |  TypeScript + Vite + Tailwind CSS   |
                          |  TanStack Query + React Hook Form   |
                          +------------------+------------------+
                                             |  REST JSON (v1)
                                             |  Bearer JWT Tokens
                                             v
+-----------------------------------------------------------------------------------------------+
|                                      FastAPI Backend                                          |
|                                                                                               |
|  +--------------------+  +--------------------+  +--------------------+  +-----------------+  |
|  |    Auth Router     |  |  Interview Router  |  |  Evaluation Router |  | Analytics Router|  |
|  +---------+----------+  +---------+----------+  +---------+----------+  +--------+--------+  |
|            |                       |                       |                      |           |
|            v                       v                       v                      v           |
|  +--------------------+  +--------------------+  +--------------------+  +-----------------+  |
|  |    Auth Service    |  |  Interview Service |  | Evaluation Service |  |Analytics Service|  |
|  +---------+----------+  +---------+----------+  +---------+----------+  +--------+--------+  |
|            |                       |                       |                      |           |
|            |                       +-----------+-----------+                      |           |
|            |                                   |                                  |           |
|            |                                   v                                  |           |
|            |                     +---------------------------+                    |           |
|            |                     |   Gemini Service / Mock   |                    |           |
|            |                     |    (google-genai SDK)     |                    |           |
|            |                     +-------------+-------------+                    |           |
|            v                                   v                                  v           |
|  +-----------------------------------------------------------------------------------------+  |
|  |                     SQLAlchemy 2.0 ORM / Alembic Migrations                             |  |
|  +---------------------------------------------+-------------------------------------------+  |
+------------------------------------------------|----------------------------------------------+
                                                 v
                                 +-------------------------------+
                                 |      PostgreSQL / SQLite      |
                                 +-------------------------------+
```

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query v5, React Hook Form, Zod, Lucide React.
- **Backend:** Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Argon2id (`argon2-cffi`), PyJWT, `google-genai` SDK, Uvicorn.
- **Database:** PostgreSQL (production / Docker) with automatic SQLite support for instant zero-dependency local runs.

---

## 3. Environment Variables Reference

Copy `.env.example` to `.env`:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `APP_NAME` | Display name of the application | `AI Interview Agent` |
| `APP_ENV` | Application environment (`development`, `production`, `testing`) | `development` |
| `API_V1_PREFIX` | Versioned route prefix | `/api/v1` |
| `BACKEND_HOST` | Backend listener IP | `0.0.0.0` |
| `BACKEND_PORT` | Backend listener port | `8000` |
| `FRONTEND_ORIGIN` | Allowed CORS origins (comma-separated for multiple) | `http://localhost:5173` |
| `DATABASE_URL` | Database connection URL | `postgresql+psycopg://app_user:pass@localhost:5432/ai_interview_agent` |
| `GEMINI_API_KEY` | Google AI Studio Gemini API key | *(leave empty to use built-in Mock service)* |
| `GEMINI_MODEL` | Gemini model identifier | `gemini-2.5-flash` |
| `JWT_SECRET_KEY` | Secret key used for signing JWT tokens | *(generate with `python -c "import secrets; print(secrets.token_urlsafe(32))"`)* |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan | `120` |

---

## 4. Local Development Instructions

### Option A: Direct Local Run (Fastest, Zero External Dependencies)

#### 1. Backend Setup
```bash
# Navigate to backend and create virtual environment
cd backend
python -m venv .venv

# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements-dev.txt

# Run database migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
*Backend is running at `http://localhost:8000` (API Docs: `http://localhost:8000/docs`).*

#### 2. Frontend Setup (in a separate terminal)
```bash
cd frontend
npm install
npm run dev
```
*Frontend is running at `http://localhost:5173`.*

---

### Option B: Docker Compose (Full Stack with PostgreSQL)

1. Ensure Docker Desktop is running.
2. In the repository root, run:
```bash
docker compose up --build
```
This boots:
- PostgreSQL 16 on port `5432` with a persistent volume (`postgres_data`).
- FastAPI backend on port `8000` (applies Alembic migrations automatically on startup).
- React frontend served via Nginx on port `5173` and port `80`.

---

## 5. Running the Test Suite

### Backend Unit & Integration Tests (14 passing tests)
The test suite utilizes an automated in-memory SQLite database and deterministic Mock AI provider, requiring zero external API credits or network access.

```bash
# From repository root
backend\.venv\Scripts\pytest backend\app\tests -v
```

### Code Quality & Ruff Linter
```bash
backend\.venv\Scripts\ruff check backend/app
```

### Frontend Vitest & TypeScript Build Check
```bash
cd frontend
npm test
npm run build
```

---

## 6. Production Deployment Guide

### Deploying the Backend
1. **Managed Database:** Provision a PostgreSQL instance (e.g. Neon, Supabase, AWS RDS, Railway, Render).
2. **Environment Configuration:** In your hosting provider (Render, Railway, Fly.io, Heroku):
   - Set `DATABASE_URL` to your production PostgreSQL connection string (`postgresql+psycopg://...`).
   - Set `GEMINI_API_KEY` to your Google AI Studio API key.
   - Set `JWT_SECRET_KEY` to a cryptographically random 32+ character string.
   - Set `FRONTEND_ORIGIN` to your production frontend domain (e.g. `https://your-domain.vercel.app`).
   - Set `APP_ENV=production`.
3. **Run Migrations:**
   ```bash
   alembic upgrade head
   ```
4. **Start Command:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### Deploying the Frontend
1. Host on **Vercel**, **Netlify**, or **Cloudflare Pages**.
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Configure reverse proxy or rewrite `/api/*` to your production backend URL.

---

## 7. Security Architecture Checklist

- [x] Passwords hashed with **Argon2id**.
- [x] JWT Bearer authentication with ownership verification on every private endpoint.
- [x] Strict CORS origin configuration.
- [x] Never store or return password hashes or raw secrets in API responses.
- [x] Candidate answers are saved before evaluation to prevent data loss.
- [x] Gemini API key is isolated strictly to backend server memory.
- [x] Reference answers are hidden from candidates until final evaluation.
- [x] Prompt injection mitigation using distinct XML/data boundary tags.
- [x] Scores are computed and verified server-side.

---

## 8. Practice Disclaimer

All scores, evaluations, and suggestions generated by AI Interview Agent 2.0 are designed for rehearsal and study guidance. They do not constitute official hiring or employment decisions.
