from fastapi.testclient import TestClient


def test_create_interview_and_generate_questions(client: TestClient, auth_headers: dict):
    payload = {
        "target_role": "Python Developer",
        "experience_level": "Intermediate",
        "difficulty": "Medium",
        "focus_topics": ["FastAPI", "SQLAlchemy", "AsyncIO"],
        "question_count": 3,
        "job_description": "We are seeking a Python backend engineer proficient in async APIs.",
    }
    response = client.post("/api/v1/interviews", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["target_role"] == "Python Developer"
    assert data["status"] == "in_progress"
    assert len(data["questions"]) == 3
    # Check that reference_answer is NOT exposed
    for q in data["questions"]:
        assert "reference_answer" not in q
        assert "question_text" in q
        assert "topic" in q


def test_interview_validation_constraints(client: TestClient, auth_headers: dict):
    # Invalid question count (<3)
    bad_count = {
        "target_role": "Backend Developer",
        "experience_level": "Beginner",
        "difficulty": "Easy",
        "question_count": 1,
    }
    res = client.post("/api/v1/interviews", json=bad_count, headers=auth_headers)
    assert res.status_code == 422

    # Invalid difficulty
    bad_diff = {
        "target_role": "Backend Developer",
        "experience_level": "Beginner",
        "difficulty": "SuperHard",
        "question_count": 3,
    }
    res2 = client.post("/api/v1/interviews", json=bad_diff, headers=auth_headers)
    assert res2.status_code == 422


def test_save_draft_and_submit_answer(client: TestClient, auth_headers: dict):
    # Create interview
    create_res = client.post(
        "/api/v1/interviews",
        json={
            "target_role": "Backend Engineer",
            "experience_level": "Intermediate",
            "difficulty": "Medium",
            "question_count": 3,
        },
        headers=auth_headers,
    )
    interview = create_res.json()
    interview_id = interview["id"]
    question_id = interview["questions"][0]["id"]

    # Save draft
    draft_res = client.put(
        f"/api/v1/interviews/{interview_id}/questions/{question_id}/answer",
        json={"answer_text": "This is my initial draft explanation."},
        headers=auth_headers,
    )
    assert draft_res.status_code == 200
    draft_data = draft_res.json()
    assert draft_data["status"] == "draft"
    assert draft_data["answer_text"] == "This is my initial draft explanation."

    # Submit answer
    submit_res = client.post(
        f"/api/v1/interviews/{interview_id}/questions/{question_id}/submit",
        json={"answer_text": "This is my final submitted answer detailing the implementation."},
        headers=auth_headers,
    )
    assert submit_res.status_code == 200
    submit_data = submit_res.json()
    assert submit_data["status"] == "submitted"
    assert submit_data["submitted_at"] is not None


def test_user_ownership_isolation(
    client: TestClient, auth_headers: dict, second_user_auth_headers: dict
):
    # User A creates interview
    create_res = client.post(
        "/api/v1/interviews",
        json={
            "target_role": "Data Scientist",
            "experience_level": "Advanced",
            "difficulty": "Hard",
            "question_count": 3,
        },
        headers=auth_headers,
    )
    interview_id = create_res.json()["id"]

    # User B cannot read User A's interview
    get_res = client.get(f"/api/v1/interviews/{interview_id}", headers=second_user_auth_headers)
    assert get_res.status_code == 404

    # User B cannot update User A's interview
    patch_res = client.patch(
        f"/api/v1/interviews/{interview_id}",
        json={"title": "Hacked Title"},
        headers=second_user_auth_headers,
    )
    assert patch_res.status_code == 404

    # User B cannot delete User A's interview
    del_res = client.delete(
        f"/api/v1/interviews/{interview_id}",
        headers=second_user_auth_headers,
    )
    assert del_res.status_code == 404

    # User A CAN delete their own interview
    owner_del_res = client.delete(
        f"/api/v1/interviews/{interview_id}",
        headers=auth_headers,
    )
    assert owner_del_res.status_code == 204

    # Verify interview is gone
    verify_res = client.get(f"/api/v1/interviews/{interview_id}", headers=auth_headers)
    assert verify_res.status_code == 404
