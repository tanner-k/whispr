"""Runtime configuration for the Whispr backend."""

from __future__ import annotations

import os
import platform
from dataclasses import dataclass
from pathlib import Path

DEFAULT_STT_MODEL = "openai/whisper-large-v3"
DEFAULT_LLM_MODEL = "unsloth/gemma-4-E4B-it-GGUF:UD-Q4_K_XL"
DEV_STT_MODEL = "dev/null-stt"
DEV_LLM_MODEL = "dev/null-llm"


def repo_root() -> Path:
    """Return the repository root from inside the installed package layout."""
    return Path(__file__).resolve().parents[2]


def select_device() -> str:
    """Select the best local inference device without importing model runtimes."""
    if override := os.getenv("WHISPR_DEVICE"):
        return override
    if platform.system() == "Darwin" and platform.machine() in {"arm64", "aarch64"}:
        return "mps"
    return "cpu"


def _flag_enabled(name: str) -> bool:
    value = os.getenv(name, "")
    return value.lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True, slots=True)
class AppSettings:
    """All runtime settings consumed by the backend."""

    repo_root: Path
    data_dir: Path
    frontend_dist: Path
    stt_model: str
    llm_model: str
    device: str
    cors_origins: tuple[str, ...]
    dev_model_override: bool

    @classmethod
    def from_env(cls) -> AppSettings:
        root = repo_root()
        dev_models = _flag_enabled("WHISPR_DEV_MODELS")
        stt_default = DEV_STT_MODEL if dev_models else DEFAULT_STT_MODEL
        llm_default = DEV_LLM_MODEL if dev_models else DEFAULT_LLM_MODEL
        stt_model = os.getenv("WHISPR_STT_MODEL", stt_default)
        llm_model = os.getenv("WHISPR_LLM_MODEL", llm_default)
        origins = os.getenv(
            "WHISPR_CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173",
        )
        return cls(
            repo_root=root,
            data_dir=Path(os.getenv("WHISPR_DATA_DIR", root / "data")),
            frontend_dist=Path(os.getenv("WHISPR_FRONTEND_DIST", root / "frontend" / "dist")),
            stt_model=stt_model,
            llm_model=llm_model,
            device=os.getenv("WHISPR_DEVICE", select_device()),
            cors_origins=tuple(origin.strip() for origin in origins.split(",") if origin.strip()),
            dev_model_override=dev_models,
        )


settings = AppSettings.from_env()
