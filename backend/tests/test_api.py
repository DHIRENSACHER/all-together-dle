import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["solutions_count"] == 2315
    assert data["valid_guesses_count"] == 12540
    assert data["total_words"] == 14855


def test_validate_word():
    # Valid solution word
    res1 = client.post("/api/v1/words/validate", json={"word": "CRANE"})
    assert res1.status_code == 200
    assert res1.json()["is_valid"] is True

    # Valid guess-only word
    res2 = client.post("/api/v1/words/validate", json={"word": "AAHED"})
    assert res2.status_code == 200
    assert res2.json()["is_valid"] is True

    # Invalid word
    res3 = client.post("/api/v1/words/validate", json={"word": "XYZZY"})
    assert res3.status_code == 200
    assert res3.json()["is_valid"] is False


def test_evaluate_endpoint():
    # Wordle evaluation
    req_body = {
        "guess": "BABES",
        "targets": ["ABBEY", "SPEED"]
    }
    response = client.post("/api/v1/game/evaluate", json=req_body)
    assert response.status_code == 200
    data = response.json()
    assert data["guess"] == "BABES"
    assert len(data["evaluations"]) == 2
    # Check ABBEY
    assert data["evaluations"][0]["pattern"] == ["yellow", "yellow", "green", "green", "gray"]
    assert data["evaluations"][0]["is_solved"] is False


def test_daily_endpoint():
    response = client.get("/api/v1/game/daily?mode=quordle&date=2026-10-23")
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "quordle"
    assert len(data["targets"]) == 4
    assert data["max_guesses"] == 9


def test_entropy_hints_endpoint():
    req_body = {
        "candidate_words": ["CATER", "WATER", "HATER", "LATER", "EATER"],
        "top_k": 3
    }
    response = client.post("/api/v1/entropy/hints", json=req_body)
    assert response.status_code == 200
    data = response.json()
    assert data["candidate_count"] == 5
    assert len(data["top_recommendations"]) <= 3
    assert data["top_recommendations"][0]["entropy_bits"] > 0


def test_absurdle_step_endpoint():
    req_body = {
        "guess": "XYLYL"
    }
    response = client.post("/api/v1/absurdle/guess", json=req_body)
    assert response.status_code == 200
    data = response.json()
    assert data["guess"] == "XYLYL"
    assert data["chosen_pattern"] == ["gray", "gray", "gray", "gray", "gray"]
    assert data["remaining_count"] == 1334
    assert data["is_game_won"] is False


def test_hard_mode_validate_endpoint():
    # Turn 1: guessed CRANE -> R green at pos 2 (index 1)
    req_body = {
        "current_guess": "CLERK",
        "prior_guesses": ["CRANE"],
        "prior_evaluations": [["gray", "green", "gray", "gray", "gray"]]
    }
    response = client.post("/api/v1/game/hard-mode/validate", json=req_body)
    assert response.status_code == 200
    # Pos 2 is L not R -> invalid!
    assert response.json()["is_valid"] is False
    assert "Position 2 must be 'R'" in response.json()["error_message"]


def test_root_serves_spa():
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]

