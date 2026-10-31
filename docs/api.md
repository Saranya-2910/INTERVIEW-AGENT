# REST API Reference - AI Interview Agent 2.0

Version: `2.0.0`  
Base Prefix: `/api/v1`

---

## 1. Authentication Endpoints

### Register New Candidate
- **Endpoint**: `POST /api/v1/auth/register`
- **Request Body**:
```json
{
  "name": "Jane Candidate",
  "email": "jane@example.com",
  "password": "StrongPassword123!"
}
```
- **Response** (`201 Created`):
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": "e30da423-...",
    "name": "Jane Candidate",
    "email": "jane@example.com",
    "is_active": true,
    "created_at": "2026-10-31T02:00:00Z",
    "updated_at": "2026-10-31T02:00:00Z"
  }
}
```

### Sign In
- **Endpoint**: `POST /api/v1/auth/login`
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "StrongPassword123!"
}
```
- **Response** (`200 OK`): TokenResponse

### Get Current User Profile
- **Endpoint**: `GET /api/v1/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): UserOut

### Logout
- **Endpoint**: `POST /api/v1/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): `{"message": "Logged out successfully"}`

---

## 2. Interview Management Endpoints

### Create and Generate Interview
- **Endpoint**: `POST /api/v1/interviews`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "target_role": "Python Developer",
  "experience_level": "Intermediate",
  "difficulty": "Medium",
  "focus_topics": ["FastAPI", "SQLAlchemy", "AsyncIO"],
  "question_count": 5,
  "job_description": "Optional job requirements context..."
}
```
- **Response** (`201 Created`): Returns interview object with generated questions (reference answers hidden).

### List Candidate Interviews
- **Endpoint**: `GET /api/v1/interviews?limit=20&offset=0&status=completed&role=Python`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): Paginated interview items and total count.

### Get Interview Details
- **Endpoint**: `GET /api/v1/interviews/{interview_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): Interview object with question list and user answer statuses.

### Update Interview Title
- **Endpoint**: `PATCH /api/v1/interviews/{interview_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{"title": "Updated Custom Title"}`

### Delete Interview
- **Endpoint**: `DELETE /api/v1/interviews/{interview_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`204 No Content`): Cascading deletion of questions, answers, and evaluations.

---

## 3. Answers & Evaluation Endpoints

### Save Draft Answer
- **Endpoint**: `PUT /api/v1/interviews/{interview_id}/questions/{question_id}/answer`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{"answer_text": "Draft content..."}`

### Submit Answer
- **Endpoint**: `POST /api/v1/interviews/{interview_id}/questions/{question_id}/submit`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `{"answer_text": "Final submitted answer content..."}`

### Evaluate Interview Session
- **Endpoint**: `POST /api/v1/interviews/{interview_id}/evaluate`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`): Full completed interview report.

### Get Completed Report
- **Endpoint**: `GET /api/v1/interviews/{interview_id}/report`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
```json
{
  "interview_id": "...",
  "title": "Python Developer Interview",
  "target_role": "Python Developer",
  "experience_level": "Intermediate",
  "difficulty": "Medium",
  "status": "completed",
  "overall_score": 8.2,
  "recommendation_label": "Ready to practise harder questions",
  "recommendation_reason": "Demonstrated strong technical command...",
  "disclaimer": "AI feedback is provided as practice guidance...",
  "summary_strengths": ["Clear explanation of event loop"],
  "summary_improvement_areas": ["Could explain thread safety"],
  "recommended_revision_topics": ["Concurrency", "AsyncIO"],
  "practice_plan": ["Practice advanced system design"],
  "topic_breakdown": [{"topic": "FastAPI", "average_score": 8.5, "question_count": 2}],
  "questions": [...]
}
```

---

## 4. Analytics Endpoints

- `GET /api/v1/analytics/summary` - Totals, averages, top strengths, revision topics
- `GET /api/v1/analytics/topics` - Topic metrics with sample counts
- `GET /api/v1/analytics/progress` - Dated score points for progression chart

---

## 5. System Health

- `GET /health` - Service status and version
- `GET /ready` - Database connectivity readiness
