"""Audio decode and normalization helpers."""

from __future__ import annotations

import subprocess
import tempfile
import wave
from dataclasses import dataclass
from pathlib import Path


class AudioDecodeError(RuntimeError):
    """Raised when ffmpeg cannot decode uploaded audio."""


@dataclass(frozen=True, slots=True)
class NormalizedAudio:
    """Path and duration for audio normalized for Whisper."""

    path: Path
    duration: float


def decode_normalize_audio(source: Path, output_dir: Path | None = None) -> NormalizedAudio:
    """Decode arbitrary browser audio into mono 16 kHz WAV for STT."""
    output_path = _output_path(output_dir)
    command = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        str(source),
        "-ac",
        "1",
        "-ar",
        "16000",
        "-vn",
        "-f",
        "wav",
        str(output_path),
    ]
    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
    except FileNotFoundError as exc:
        raise AudioDecodeError("ffmpeg is required to decode captured audio") from exc
    except subprocess.CalledProcessError as exc:
        detail = exc.stderr.strip() or "ffmpeg failed to decode captured audio"
        raise AudioDecodeError(detail) from exc

    return NormalizedAudio(path=output_path, duration=_wav_duration(output_path))


def _output_path(output_dir: Path | None) -> Path:
    if output_dir is not None:
        output_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".wav", dir=output_dir, delete=False) as handle:
        path = Path(handle.name)
    return path


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
