"""Raw speech-to-text route for machine callers."""

from __future__ import annotations

import tempfile
import time
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

from whispr.api.deps import AudioNormalizerDep, SttEngineDep
from whispr.capture.audio import AudioDecodeError
from whispr.models import ApiEnvelope, RawTranscript, ok
from whispr.stt import SttError

router = APIRouter(prefix="/api/stt", tags=["stt"])


@router.post("/transcribe", response_model=ApiEnvelope[RawTranscript], status_code=201)
async def transcribe_raw(
    audio: UploadFile,
    stt_engine: SttEngineDep,
    normalize_audio: AudioNormalizerDep,
) -> ApiEnvelope[RawTranscript]:
    """Transcribe uploaded audio without formatting, routing, or history writes."""
    if not audio.filename and not audio.content_type:
        raise HTTPException(status_code=400, detail="audio upload is required")

    with tempfile.TemporaryDirectory(prefix="whispr-stt-") as tmp:
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
        try:
            transcript = stt_engine.transcribe(normalized.path)
        except SttError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        stt_ms = round((time.perf_counter() - stt_started) * 1000)

    return ok(
        RawTranscript(
            raw=transcript.raw,
            duration=transcript.duration or normalized.duration,
            sttMs=stt_ms,
        )
    )


def _safe_upload_name(filename: str | None) -> str:
    if not filename:
        return "capture.webm"
    return Path(filename).name or "capture.webm"
