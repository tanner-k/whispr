"""Shared speech-to-text engine contract."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol


@dataclass(frozen=True, slots=True)
class TranscriptResult:
    """Result returned by a speech-to-text engine."""

    raw: str
    duration: float


class Engine(Protocol):
    """Protocol implemented by all transcription engines."""

    def transcribe(self, path: Path) -> TranscriptResult:
        """Transcribe an audio file and return raw text plus duration."""
