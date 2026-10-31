from fastapi.testclient import TestClient

from app.core.security import hash_password, verify_password


def test_argon2_password_hashing():
    pwd = "MySecretPassword123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert hashed.startswith("$argon2id$")
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_user_registration_success(client: TestClient):
    payload = {
        "name": "Jane Candidate",
        "email": "jane@example.com",
        "password": "SecurePassword999",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "jane@example.com"
    assert data["user"]["name"] == "Jane Candidate"
    assert "password_hash" not in data["user"]


def test_duplicate_registration_rejected(client: TestClient):
    payload = {
        "name": "Jane Candidate",
        "email": "jane@example.com",
        "password": "SecurePassword999",
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409
    error = res2.json()["error"]
    assert error["code"] == "CONFLICT"


def test_login_success_and_failure(client: TestClient):
    # Register first
    client.post(
        "/api/v1/auth/register",
        json={"name": "Bob", "email": "bob@example.com", "password": "Password123!"},
    )

    # Login with wrong password
    bad_res = client.post(
        "/api/v1/auth/login",
        json={"email": "bob@example.com", "password": "WrongPassword"},
    )
    assert bad_res.status_code == 401

    # Login with correct password
    good_res = client.post(
        "/api/v1/auth/login",
        json={"email": "bob@example.com", "password": "Password123!"},
    )
    assert good_res.status_code == 200
    assert "access_token" in good_res.json()


def test_get_current_user_me(client: TestClient, auth_headers: dict):
    # Without token
    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401

    # With valid token
    auth_res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert auth_res.status_code == 200
    user_data = auth_res.json()
    assert user_data["email"] == "alex@example.com"
    assert user_data["name"] == "Alex Developer"
