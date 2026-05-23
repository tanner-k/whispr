"""Apple Speech STT placeholder."""

from __future__ import annotations

from pathlib import Path

from .base import TranscriptResult


class AppleSpeechEngine:
    """Stub for a future on-device Apple Speech engine."""

    def transcribe(self, path: Path) -> TranscriptResult:
        raise NotImplementedError("Apple Speech STT is not implemented yet")
