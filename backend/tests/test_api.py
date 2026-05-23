"""Route tests for the Whispr FastAPI app."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

from whispr.api.app import create_app
from whispr.api.deps import get_audio_normalizer, get_stt_engine
from whispr.capture.audio import NormalizedAudio
from whispr.config import DEFAULT_LLM_MODEL, DEFAULT_STT_MODEL, AppSettings
from whispr.stt import TranscriptResult


def make_settings(tmp_path: Path) -> AppSettings:
    return AppSettings(
        repo_root=tmp_path,
        data_dir=tmp_path / "data",
        frontend_dist=tmp_path / "dist",
        stt_model=DEFAULT_STT_MODEL,
        llm_model=DEFAULT_LLM_MODEL,
        device="cpu",
        cors_origins=("http://testserver",),
        dev_model_override=False,
    )


def unwrap(response_json: dict[str, Any]) -> Any:
    assert response_json["success"] is True
    assert response_json["error"] is None
    return response_json["data"]


class FakeEngine:
    def transcribe(self, path: Path) -> TranscriptResult:
        assert path.name == "clip.webm"
        return TranscriptResult(
            raw="Milk, eggs, and bread. Format as checklist.",
            duration=2.6,
        )


def fake_normalize(path: Path, _output_dir: Path | None) -> NormalizedAudio:
    return NormalizedAudio(path=path, duration=2.6)


def test_health_route(tmp_path: Path) -> None:
    with TestClient(create_app(make_settings(tmp_path))) as client:
        data = unwrap(client.get("/api/health").json())

    assert data["status"] == "ok"
    assert data["llmModel"] == DEFAULT_LLM_MODEL
    assert data["device"] == "cpu"


def test_history_crud_routes(tmp_path: Path) -> None:
    with TestClient(create_app(make_settings(tmp_path))) as client:
        initial = unwrap(client.get("/api/history").json())
        payload = {
            "id": "h-route",
            "when": "Today · 12:30",
            "title": "Route test",
            "format": "list",
            "preview": "One, two",
            "durationS": 2,
            "totalMs": 123,
            "starred": False,
            "route": "clipboard",
        }

        created = unwrap(client.post("/api/history", json=payload).json())
        after_create = unwrap(client.get("/api/history").json())
        deleted = unwrap(client.delete("/api/history/h-route").json())

    assert created == payload
    assert len(after_create) == len(initial) + 1
    assert deleted == {"id": "h-route"}


def test_capture_transcribe_persists_history_with_fake_engine(tmp_path: Path) -> None:
    app = create_app(make_settings(tmp_path))
    app.dependency_overrides[get_stt_engine] = lambda: FakeEngine()
    app.dependency_overrides[get_audio_normalizer] = lambda: fake_normalize

    with TestClient(app) as client:
        initial = unwrap(client.get("/api/history").json())
        response = client.post(
            "/api/capture/transcribe",
            files={"audio": ("clip.webm", b"not-real-audio", "audio/webm")},
        )
        sample = unwrap(response.json())
        after_create = unwrap(client.get("/api/history").json())

    assert response.status_code == 201
    assert sample["raw"] == "Milk, eggs, and bread. Format as checklist."
    assert sample["cleaned"] == "Milk, eggs, and bread."
    assert sample["format"] == "check"
    assert sample["formatted"]["check"] == "- [ ] Milk\n- [ ] eggs\n- [ ] bread"
    assert len(after_create) == len(initial) + 1
    assert after_create[-1]["id"] == f"h-{sample['id']}"
    assert after_create[-1]["format"] == "check"


def test_vocab_crud_routes(tmp_path: Path) -> None:
    with TestClient(create_app(make_settings(tmp_path))) as client:
        payload = {
            "id": 101,
            "phrase": "make a table",
            "target": {"type": "format", "value": "table"},
            "builtin": False,
            "hits": 0,
        }

        created = unwrap(client.post("/api/vocab", json=payload).json())
        vocab = unwrap(client.get("/api/vocab").json())
        deleted = unwrap(client.delete("/api/vocab", params={"id": 101}).json())

    assert created == payload
    assert vocab[-1] == payload
    assert deleted == {"id": 101}


def test_bench_routes_and_settings_patch(tmp_path: Path) -> None:
    with TestClient(create_app(make_settings(tmp_path))) as client:
        samples = unwrap(client.get("/api/bench/samples").json())
        stats = unwrap(client.get("/api/bench/stats").json())
        settings = unwrap(
            client.patch(
                "/api/settings",
                json={"model": {"temperature": 0.45}, "privacy": {"audioRetention": "1d"}},
            ).json()
        )

    assert len(samples) == 5
    assert stats["sampleCount"] == 5
    assert settings["model"]["temperature"] == 0.45
    assert settings["privacy"]["audioRetention"] == "1d"
