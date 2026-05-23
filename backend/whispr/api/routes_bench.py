"""Bench corpus routes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query

from whispr.api.deps import StoreDep
from whispr.models import ApiEnvelope, BenchSample, BenchStats, ok

router = APIRouter(prefix="/api/bench", tags=["bench"])


@router.get("/samples", response_model=ApiEnvelope[list[BenchSample]])
def list_bench_samples(store: StoreDep) -> ApiEnvelope[list[BenchSample]]:
    return ok(store.list_bench_samples())


@router.post("/samples", response_model=ApiEnvelope[BenchSample], status_code=201)
def add_bench_sample(sample: BenchSample, store: StoreDep) -> ApiEnvelope[BenchSample]:
    return ok(store.add_bench_sample(sample))


@router.delete("/samples", response_model=ApiEnvelope[dict[str, str]])
def delete_bench_sample_by_query(
    id: Annotated[str, Query(min_length=1)], store: StoreDep
) -> ApiEnvelope[dict[str, str]]:
    store.delete_bench_sample(id)
    return ok({"id": id})


@router.delete("/samples/{sample_id}", response_model=ApiEnvelope[dict[str, str]])
def delete_bench_sample(sample_id: str, store: StoreDep) -> ApiEnvelope[dict[str, str]]:
    store.delete_bench_sample(sample_id)
    return ok({"id": sample_id})


@router.get("/stats", response_model=ApiEnvelope[BenchStats])
def bench_stats(store: StoreDep) -> ApiEnvelope[BenchStats]:
    return ok(store.bench_stats())
