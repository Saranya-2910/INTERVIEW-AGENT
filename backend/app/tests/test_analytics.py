from fastapi.testclient import TestClient


def test_analytics_empty_state(client: TestClient, auth_headers: dict):
    res = client.get("/api/v1/analytics/summary", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_interviews"] == 0
    assert data["completed_interviews"] == 0
    assert data["average_score"] is None
    assert data["latest_score"] is None

    topics_res = client.get("/api/v1/analytics/topics", headers=auth_headers)
    assert topics_res.status_code == 200
    assert topics_res.json()["topics"] == []

    prog_res = client.get("/api/v1/analytics/progress", headers=auth_headers)
    assert prog_res.status_code == 200
    assert prog_res.json()["points"] == []


def test_analytics_with_completed_interview(
    client: TestClient, auth_headers: dict, second_user_auth_headers: dict
):
    # User A creates, answers, and completes interview
    create_res = client.post(
        "/api/v1/interviews",
        json={
            "target_role": "Machine Learning Engineer",
            "experience_level": "Intermediate",
            "difficulty": "Medium",
            "focus_topics": ["PyTorch", "Transformers"],
            "question_count": 3,
        },
        headers=auth_headers,
    )
    interview_id = create_res.json()["id"]
    for q in create_res.json()["questions"]:
        client.post(
            f"/api/v1/interviews/{interview_id}/questions/{q['id']}/submit",
            json={
                "answer_text": "Detailed technical explanation demonstrating knowledge of gradient descent, backpropagation, and tensor shapes."
            },
            headers=auth_headers,
        )

    client.post(f"/api/v1/interviews/{interview_id}/evaluate", headers=auth_headers)

    # Check summary for User A
    summary_res = client.get("/api/v1/analytics/summary", headers=auth_headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["total_interviews"] == 1
    assert summary["completed_interviews"] == 1
    assert summary["average_score"] > 0
    assert summary["latest_score"] > 0

    # Check progress for User A
    prog_res = client.get("/api/v1/analytics/progress", headers=auth_headers)
    assert prog_res.status_code == 200
    assert len(prog_res.json()["points"]) == 1

    # Check topic analytics for User A
    topics_res = client.get("/api/v1/analytics/topics", headers=auth_headers)
    assert topics_res.status_code == 200
    assert len(topics_res.json()["topics"]) > 0

    # User B should still see empty analytics (User isolation)
    user_b_summary = client.get("/api/v1/analytics/summary", headers=second_user_auth_headers)
    assert user_b_summary.status_code == 200
    assert user_b_summary.json()["total_interviews"] == 0
    assert user_b_summary.json()["completed_interviews"] == 0
