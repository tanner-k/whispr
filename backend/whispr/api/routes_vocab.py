"""Vocabulary routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from whispr.api.deps import StoreDep
from whispr.models import ApiEnvelope, VocabItem, ok

router = APIRouter(prefix="/api/vocab", tags=["vocab"])


@router.get("", response_model=ApiEnvelope[list[VocabItem]])
def list_vocab(store: StoreDep) -> ApiEnvelope[list[VocabItem]]:
    return ok(store.list_vocab())


@router.post("", response_model=ApiEnvelope[VocabItem], status_code=201)
def add_vocab(item: VocabItem, store: StoreDep) -> ApiEnvelope[VocabItem]:
    return ok(store.add_vocab(item))


@router.delete("", response_model=ApiEnvelope[dict[str, int]])
def delete_vocab_by_query(
    id: Annotated[int, Query(ge=1)], store: StoreDep
) -> ApiEnvelope[dict[str, int]]:
    store.delete_vocab(id)
    return ok({"id": id})


@router.delete("/{item_id}", response_model=ApiEnvelope[dict[str, int]])
def delete_vocab(item_id: int, store: StoreDep) -> ApiEnvelope[dict[str, int]]:
    store.delete_vocab(item_id)
    return ok({"id": item_id})
