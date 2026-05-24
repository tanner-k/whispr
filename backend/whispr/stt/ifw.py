"""Whisper large-v3 engine inspired by insanely-fast-whisper defaults."""

from __future__ import annotations

import wave
from pathlib import Path
from typing import Any

from whispr.config import DEFAULT_TRANSFORMERS_STT_MODEL, select_device

from .base import TranscriptResult


class InsanelyFastWhisperEngine:
    """Lazy-loading Transformers ASR pipeline for Whisper large-v3."""

    def __init__(
        self,
        model_id: str = DEFAULT_TRANSFORMERS_STT_MODEL,
        *,
        device: str | None = None,
        chunk_length_s: int = 30,
        batch_size: int = 24,
    ) -> None:
        self.model_id = model_id
        self.device = device or select_device()
        self.chunk_length_s = chunk_length_s
        self.batch_size = batch_size
        self._pipeline: Any | None = None

    def transcribe(self, path: Path) -> TranscriptResult:
        """Transcribe a normalized audio file with chunked batched inference."""
        result = self._asr()(
            str(path),
            chunk_length_s=self.chunk_length_s,
            batch_size=self.batch_size,
        )
        text = _extract_text(result)
        return TranscriptResult(raw=text, duration=_wav_duration(path))

    def _asr(self) -> Any:
        if self._pipeline is None:
            self._pipeline = self._build_pipeline()
        return self._pipeline

    def _build_pipeline(self) -> Any:
        from transformers import pipeline

        torch_dtype, device = self._torch_runtime()
        return pipeline(
            "automatic-speech-recognition",
            model=self.model_id,
            torch_dtype=torch_dtype,
            device=device,
            model_kwargs={"low_cpu_mem_usage": True},
        )

    def _torch_runtime(self) -> tuple[Any, str]:
        import torch

        requested = self.device
        if requested == "auto":
            requested = select_device()
        if requested == "cuda" and not torch.cuda.is_available():
            requested = "cpu"
        if requested == "mps" and not torch.backends.mps.is_available():
            requested = "cpu"

        dtype = torch.float16 if requested in {"cuda", "mps"} else torch.float32
        return dtype, requested


def _extract_text(result: Any) -> str:
    if isinstance(result, dict):
        text = result.get("text", "")
        return str(text).strip()
    return str(result).strip()


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
