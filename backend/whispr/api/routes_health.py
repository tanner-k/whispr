"""Health endpoint."""

from __future__ import annotations

from fastapi import APIRouter

from whispr import __version__
from whispr.api.deps import StoreDep
from whispr.models import ApiEnvelope, HealthResponse, ok

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=ApiEnvelope[HealthResponse])
def health(store: StoreDep) -> ApiEnvelope[HealthResponse]:
    settings = store.settings
    return ok(
        HealthResponse(
            status="ok",
            version=__version__,
            device=settings.device,
            sttModel=settings.stt_model,
            llmModel=settings.llm_model,
            dataDir=str(settings.data_dir),
            devModelOverride=settings.dev_model_override,
        )
    )
