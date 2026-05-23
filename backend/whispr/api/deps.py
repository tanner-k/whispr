"""FastAPI dependencies."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Annotated, cast

from fastapi import Depends, Request

from whispr.capture.audio import NormalizedAudio, decode_normalize_audio
from whispr.store import ParquetStore
from whispr.stt import Engine

type AudioNormalizer = Callable[[Path, Path | None], NormalizedAudio]


def get_store(request: Request) -> ParquetStore:
    return cast(ParquetStore, request.app.state.store)


StoreDep = Annotated[ParquetStore, Depends(get_store)]


def get_stt_engine(request: Request) -> Engine:
    return cast(Engine, request.app.state.stt_engine)


SttEngineDep = Annotated[Engine, Depends(get_stt_engine)]


def get_audio_normalizer() -> AudioNormalizer:
    return decode_normalize_audio


AudioNormalizerDep = Annotated[AudioNormalizer, Depends(get_audio_normalizer)]
