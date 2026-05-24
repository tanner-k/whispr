"""whisper.cpp speech-to-text engine."""

from __future__ import annotations

import json
import subprocess
import tempfile
import wave
from pathlib import Path

from whispr.config import DEFAULT_WHISPER_CPP_BIN, repo_root, select_device

from .base import SttError, TranscriptResult

WHISPER_CPP_PREFIX = "whisper.cpp:"


class WhisperCppEngine:
    """Shells out to whisper.cpp's Metal-capable CLI."""

    def __init__(
        self,
        model_path: str | Path,
        *,
        executable: str = DEFAULT_WHISPER_CPP_BIN,
        device: str | None = None,
        language: str = "auto",
    ) -> None:
        self.model_path = _resolve_model_path(model_path)
        self.executable = executable
        self.device = device or select_device()
        self.language = language

    def transcribe(self, path: Path) -> TranscriptResult:
        """Transcribe an audio file using whisper.cpp JSON output."""
        if not self.model_path.exists():
            raise SttError(
                f"whisper.cpp model not found at {self.model_path}. "
                "Download the configured WHISPR_STT_MODEL file before starting whispr."
            )

        with tempfile.TemporaryDirectory(prefix="whispr-whisper-cpp-") as tmp:
            output_base = Path(tmp) / "transcript"
            cmd = [
                self.executable,
                "-m",
                str(self.model_path),
                "-f",
                str(path),
                "-l",
                self.language,
                "-nt",
                "-oj",
                "-of",
                str(output_base),
            ]
            if self.device == "cpu":
                cmd.append("--no-gpu")

            try:
                subprocess.run(cmd, check=True, capture_output=True, text=True)
                raw = _read_transcript(output_base.with_suffix(".json"))
            except FileNotFoundError as exc:
                raise SttError(
                    f"{self.executable} was not found. Install whisper.cpp or set WHISPER_CPP_BIN."
                ) from exc
            except subprocess.CalledProcessError as exc:
                detail = (exc.stderr or exc.stdout or "").strip()
                message = "whisper.cpp transcription failed"
                if detail:
                    message = f"{message}: {detail}"
                raise SttError(message) from exc
            except (OSError, json.JSONDecodeError) as exc:
                raise SttError("whisper.cpp did not produce a readable transcript") from exc

        return TranscriptResult(raw=raw, duration=_wav_duration(path))


def create_stt_engine(
    model_id: str,
    *,
    whisper_cpp_bin: str = DEFAULT_WHISPER_CPP_BIN,
    device: str | None = None,
) -> object:
    """Create the configured STT engine."""
    if model_id.startswith(WHISPER_CPP_PREFIX):
        return WhisperCppEngine(
            model_id.removeprefix(WHISPER_CPP_PREFIX),
            executable=whisper_cpp_bin,
            device=device,
        )

    from whispr.stt.ifw import InsanelyFastWhisperEngine

    return InsanelyFastWhisperEngine(model_id, device=device)


def _resolve_model_path(model_path: str | Path) -> Path:
    path = Path(model_path).expanduser()
    if path.is_absolute():
        return path
    return repo_root() / path


def _read_transcript(json_path: Path) -> str:
    payload = json.loads(json_path.read_text(encoding="utf-8"))
    segments = payload.get("transcription", [])
    if not isinstance(segments, list):
        return ""
    return " ".join(
        str(segment.get("text", "")).strip() for segment in segments if isinstance(segment, dict)
    ).strip()


def _wav_duration(path: Path) -> float:
    try:
        with wave.open(str(path), "rb") as audio:
            frames = audio.getnframes()
            rate = audio.getframerate()
    except (wave.Error, OSError):
        return 0.0
    if rate <= 0:
        return 0.0
    return frames / rate
