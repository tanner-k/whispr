"""History routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from whispr.api.deps import StoreDep
from whispr.models import ApiEnvelope, HistoryItem, ok

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=ApiEnvelope[list[HistoryItem]])
def list_history(store: StoreDep) -> ApiEnvelope[list[HistoryItem]]:
    return ok(store.list_history())


@router.post("", response_model=ApiEnvelope[HistoryItem], status_code=201)
def add_history(item: HistoryItem, store: StoreDep) -> ApiEnvelope[HistoryItem]:
    return ok(store.add_history(item))


@router.delete("", response_model=ApiEnvelope[dict[str, str]])
def delete_history_by_query(
    id: Annotated[str, Query(min_length=1)], store: StoreDep
) -> ApiEnvelope[dict[str, str]]:
    store.delete_history(id)
    return ok({"id": id})


@router.delete("/{item_id}", response_model=ApiEnvelope[dict[str, str]])
def delete_history(item_id: str, store: StoreDep) -> ApiEnvelope[dict[str, str]]:
    store.delete_history(item_id)
    return ok({"id": item_id})
