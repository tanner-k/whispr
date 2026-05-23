"""Capture transcription route."""

from __future__ import annotations

import tempfile
import time
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

from whispr.api.deps import AudioNormalizerDep, StoreDep, SttEngineDep
from whispr.capture.audio import AudioDecodeError
from whispr.llm.parser import build_sample
from whispr.models import ApiEnvelope, HistoryItem, Sample, ok

router = APIRouter(prefix="/api/capture", tags=["capture"])


@router.post("/transcribe", response_model=ApiEnvelope[Sample], status_code=201)
async def transcribe_capture(
    audio: UploadFile,
    store: StoreDep,
    stt_engine: SttEngineDep,
    normalize_audio: AudioNormalizerDep,
) -> ApiEnvelope[Sample]:
    """Transcribe uploaded browser audio, format it, and persist history."""
    if not audio.filename and not audio.content_type:
        raise HTTPException(status_code=400, detail="audio upload is required")

    with tempfile.TemporaryDirectory(prefix="whispr-capture-") as tmp:
        tmp_dir = Path(tmp)
        upload_path = tmp_dir / _safe_upload_name(audio.filename)
        upload_path.write_bytes(await audio.read())
        if upload_path.stat().st_size == 0:
            raise HTTPException(status_code=400, detail="audio upload is empty")

        try:
            normalized = normalize_audio(upload_path, tmp_dir)
        except AudioDecodeError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        stt_started = time.perf_counter()
        transcript = stt_engine.transcribe(normalized.path)
        stt_ms = round((time.perf_counter() - stt_started) * 1000)

        llm_started = time.perf_counter()
        duration = transcript.duration or normalized.duration
        sample = build_sample(transcript.raw, duration=duration, stt_ms=stt_ms, llm_ms=0)
        llm_ms = round((time.perf_counter() - llm_started) * 1000)
        sample = sample.model_copy(update={"llmMs": llm_ms})

    store.add_history(_history_from_sample(sample))
    return ok(sample)


def _safe_upload_name(filename: str | None) -> str:
    if not filename:
        return "capture.webm"
    return Path(filename).name or "capture.webm"


def _history_from_sample(sample: Sample) -> HistoryItem:
    return HistoryItem(
        id=f"h-{sample.id}",
        when=f"Today · {datetime.now().strftime('%H:%M')}",
        title=sample.title,
        format=sample.format,
        preview=_preview(sample.cleaned),
        durationS=round(sample.duration),
        totalMs=sample.sttMs + sample.llmMs,
        starred=False,
        route=sample.routedTo,
    )


def _preview(text: str, limit: int = 72) -> str:
    clipped = text.strip()
    if len(clipped) <= limit:
        return clipped
    return clipped[: limit - 3].rstrip() + "..."
