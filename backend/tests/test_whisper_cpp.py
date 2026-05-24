"""Tests for the whisper.cpp STT engine wrapper."""

from __future__ import annotations

import json
import subprocess
import wave
from pathlib import Path
from typing import Any

from whispr.stt import SttError
from whispr.stt.ifw import InsanelyFastWhisperEngine
from whispr.stt.whisper_cpp import WhisperCppEngine, create_stt_engine


def write_wav(path: Path) -> None:
    with wave.open(str(path), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(16000)
        audio.writeframes(b"\0\0" * 16000)


def test_create_stt_engine_uses_whisper_cpp_prefix(tmp_path: Path) -> None:
    model_path = tmp_path / "ggml-large-v3-q5_0.bin"
    model_path.write_bytes(b"model")

    engine = create_stt_engine(
        f"whisper.cpp:{model_path}",
        whisper_cpp_bin="whisper-cli",
        device="mps",
    )

    assert isinstance(engine, WhisperCppEngine)
    assert engine.model_path == model_path


def test_create_stt_engine_keeps_transformers_models() -> None:
    engine = create_stt_engine("openai/whisper-base", device="cpu")

    assert isinstance(engine, InsanelyFastWhisperEngine)
    assert engine.model_id == "openai/whisper-base"


def test_whisper_cpp_engine_reads_json_output(
    tmp_path: Path,
    monkeypatch: Any,
) -> None:
    model_path = tmp_path / "ggml-large-v3-q5_0.bin"
    audio_path = tmp_path / "audio.wav"
    model_path.write_bytes(b"model")
    write_wav(audio_path)

    commands: list[list[str]] = []

    def fake_run(
        cmd: list[str],
        *,
        check: bool,
        capture_output: bool,
        text: bool,
    ) -> subprocess.CompletedProcess[str]:
        commands.append(cmd)
        assert check is True
        assert capture_output is True
        assert text is True
        output_base = Path(cmd[cmd.index("-of") + 1])
        output_base.with_suffix(".json").write_text(
            json.dumps(
                {
                    "transcription": [
                        {"text": " One pot creamy French onion pasta."},
                        {"text": " Fresh Gruyere."},
                    ]
                }
            ),
            encoding="utf-8",
        )
        return subprocess.CompletedProcess(cmd, 0, stdout="", stderr="")

    monkeypatch.setattr("whispr.stt.whisper_cpp.subprocess.run", fake_run)

    engine = WhisperCppEngine(model_path, executable="whisper-cli", device="cpu")
    result = engine.transcribe(audio_path)

    assert result.raw == "One pot creamy French onion pasta. Fresh Gruyere."
    assert result.duration == 1.0
    assert commands[0][-1] == "--no-gpu"


def test_whisper_cpp_engine_raises_clear_missing_model_error(tmp_path: Path) -> None:
    audio_path = tmp_path / "audio.wav"
    write_wav(audio_path)

    engine = WhisperCppEngine(tmp_path / "missing.bin", executable="whisper-cli")

    try:
        engine.transcribe(audio_path)
    except SttError as exc:
        assert "model not found" in str(exc)
    else:
        raise AssertionError("expected SttError")


def test_whisper_cpp_engine_raises_clear_missing_binary_error(
    tmp_path: Path,
    monkeypatch: Any,
) -> None:
    model_path = tmp_path / "ggml-large-v3-q5_0.bin"
    audio_path = tmp_path / "audio.wav"
    model_path.write_bytes(b"model")
    write_wav(audio_path)

    def fake_run(*_args: Any, **_kwargs: Any) -> subprocess.CompletedProcess[str]:
        raise FileNotFoundError

    monkeypatch.setattr("whispr.stt.whisper_cpp.subprocess.run", fake_run)

    engine = WhisperCppEngine(model_path, executable="missing-whisper-cli")

    try:
        engine.transcribe(audio_path)
    except SttError as exc:
        assert "missing-whisper-cli was not found" in str(exc)
    else:
        raise AssertionError("expected SttError")
