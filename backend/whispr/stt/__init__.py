"""Speech-to-text engine contracts and implementations."""

from .base import Engine, SttError, TranscriptResult
from .whisper_cpp import WhisperCppEngine, create_stt_engine

__all__ = ["Engine", "SttError", "TranscriptResult", "WhisperCppEngine", "create_stt_engine"]
