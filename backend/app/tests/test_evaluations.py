from fastapi.testclient import TestClient


def test_evaluate_interview_and_generate_report(client: TestClient, auth_headers: dict):
    # 1. Create interview
    create_res = client.post(
        "/api/v1/interviews",
        json={
            "target_role": "Full-Stack Developer",
            "experience_level": "Intermediate",
            "difficulty": "Medium",
            "focus_topics": ["React", "FastAPI", "PostgreSQL"],
            "question_count": 3,
        },
        headers=auth_headers,
    )
    interview = create_res.json()
    interview_id = interview["id"]
    questions = interview["questions"]

    # Trying to get report before evaluation should fail
    report_premature = client.get(f"/api/v1/interviews/{interview_id}/report", headers=auth_headers)
    assert report_premature.status_code == 400

    # 2. Answer question 1 and 2, leave question 3 blank to test blank-answer policy
    client.post(
        f"/api/v1/interviews/{interview_id}/questions/{questions[0]['id']}/submit",
        json={
            "answer_text": "React uses a virtual DOM to optimize UI updates by comparing trees using a diffing algorithm, batching re-renders and reducing expensive real DOM operations."
        },
        headers=auth_headers,
    )

    client.post(
        f"/api/v1/interviews/{interview_id}/questions/{questions[1]['id']}/submit",
        json={
            "answer_text": "FastAPI is built on Starlette and Pydantic. It provides automatic OpenAPI docs, asynchronous request handling via ASGI, and strong type safety."
        },
        headers=auth_headers,
    )

    # Question 3 is left unanswered/blank

    # 3. Call evaluate
    eval_res = client.post(f"/api/v1/interviews/{interview_id}/evaluate", headers=auth_headers)
    assert eval_res.status_code == 200
    report = eval_res.json()

    assert report["interview_id"] == interview_id
    assert report["status"] == "completed"
    assert report["overall_score"] is not None
    assert len(report["questions"]) == 3
    assert len(report["practice_plan"]) > 0
    assert "disclaimer" in report
    assert report["recommendation_label"] in [
        "Ready to practise harder questions",
        "Keep strengthening fundamentals",
        "Review these topics and retry",
    ]

    # Verify blank answer scored 0.0
    q3_report = next(q for q in report["questions"] if q["question_id"] == questions[2]["id"])
    assert q3_report["evaluation"]["total_score"] == 0.0

    # 4. Subsequent GET report succeeds
    get_report_res = client.get(f"/api/v1/interviews/{interview_id}/report", headers=auth_headers)
    assert get_report_res.status_code == 200
    assert get_report_res.json()["overall_score"] == report["overall_score"]

    # 5. Idempotent evaluation: repeated POST evaluate returns clean completed report
    eval_again = client.post(f"/api/v1/interviews/{interview_id}/evaluate", headers=auth_headers)
    assert eval_again.status_code == 200
    assert eval_again.json()["overall_score"] == report["overall_score"]
