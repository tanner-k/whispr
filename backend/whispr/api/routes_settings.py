"""Settings routes."""

from __future__ import annotations

from fastapi import APIRouter

from whispr.api.deps import StoreDep
from whispr.models import ApiEnvelope, Settings, SettingsPatch, ok

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=ApiEnvelope[Settings])
def get_settings(store: StoreDep) -> ApiEnvelope[Settings]:
    return ok(store.get_settings())


@router.patch("", response_model=ApiEnvelope[Settings])
def patch_settings(patch: SettingsPatch, store: StoreDep) -> ApiEnvelope[Settings]:
    return ok(store.patch_settings(patch))
