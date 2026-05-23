"""Polars/Parquet persistence for local Whispr data."""

from __future__ import annotations

import json
from collections.abc import Sequence
from pathlib import Path
from typing import Any, Literal, TypeVar

import polars as pl
from pydantic import BaseModel

from .config import AppSettings
from .models import (
    BenchSample,
    BenchStats,
    HistoryItem,
    Sample,
    Settings,
    SettingsPatch,
    VocabItem,
)
from .seeds import BENCH_SAMPLES, DEFAULT_SETTINGS, DEMO_SAMPLES, HISTORY_ITEMS, VOCAB_INITIAL

M = TypeVar("M", bound=BaseModel)
Resource = Literal["samples", "history", "bench_samples", "vocab", "settings"]

SAMPLE_SCHEMA = {
    "id": pl.Utf8,
    "raw": pl.Utf8,
    "cleaned": pl.Utf8,
    "duration": pl.Float64,
    "sttMs": pl.Int64,
    "llmMs": pl.Int64,
    "format": pl.Utf8,
    "confidence": pl.Float64,
    "title": pl.Utf8,
    "formatted": pl.Utf8,
    "alternates": pl.Utf8,
    "tools": pl.Utf8,
    "routedTo": pl.Utf8,
}
HISTORY_SCHEMA = {
    "id": pl.Utf8,
    "when": pl.Utf8,
    "title": pl.Utf8,
    "format": pl.Utf8,
    "preview": pl.Utf8,
    "durationS": pl.Int64,
    "totalMs": pl.Int64,
    "starred": pl.Boolean,
    "route": pl.Utf8,
}
BENCH_SCHEMA = {
    "id": pl.Utf8,
    "title": pl.Utf8,
    "durationS": pl.Float64,
    "truth": pl.Utf8,
    "ifw": pl.Utf8,
    "apple": pl.Utf8,
    "ifwMs": pl.Int64,
    "appleMs": pl.Int64,
    "ifwWer": pl.Float64,
    "appleWer": pl.Float64,
}
VOCAB_SCHEMA = {
    "id": pl.Int64,
    "phrase": pl.Utf8,
    "target": pl.Utf8,
    "builtin": pl.Boolean,
    "hits": pl.Int64,
}
SETTINGS_SCHEMA = {
    "transcription": pl.Utf8,
    "model": pl.Utf8,
    "privacy": pl.Utf8,
    "tools": pl.Utf8,
}

SCHEMAS: dict[Resource, dict[str, Any]] = {
    "samples": SAMPLE_SCHEMA,
    "history": HISTORY_SCHEMA,
    "bench_samples": BENCH_SCHEMA,
    "vocab": VOCAB_SCHEMA,
    "settings": SETTINGS_SCHEMA,
}

JSON_COLUMNS: dict[Resource, tuple[str, ...]] = {
    "samples": ("formatted", "alternates", "tools"),
    "history": (),
    "bench_samples": (),
    "vocab": ("target",),
    "settings": ("transcription", "model", "privacy", "tools"),
}

MODEL_BY_RESOURCE: dict[Resource, type[BaseModel]] = {
    "samples": Sample,
    "history": HistoryItem,
    "bench_samples": BenchSample,
    "vocab": VocabItem,
    "settings": Settings,
}

FILE_NAMES: dict[Resource, str] = {
    "samples": "samples.parquet",
    "history": "history.parquet",
    "bench_samples": "bench.parquet",
    "vocab": "vocab.parquet",
    "settings": "settings.parquet",
}


class StoreError(RuntimeError):
    """Raised when store invariants are violated."""


class ParquetStore:
    """Small local-first store using one Parquet file per resource."""

    def __init__(self, settings: AppSettings) -> None:
        self.settings = settings
        self.data_dir = settings.data_dir

    def seed_if_needed(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        if not self._path("samples").exists():
            self._write("samples", DEMO_SAMPLES)
        if not self._path("history").exists():
            self._write("history", HISTORY_ITEMS)
        if not self._path("bench_samples").exists():
            self._write("bench_samples", BENCH_SAMPLES)
        if not self._path("vocab").exists():
            self._write("vocab", VOCAB_INITIAL)
        if not self._path("settings").exists():
            self._write("settings", (DEFAULT_SETTINGS,))

    def list_samples(self) -> list[Sample]:
        return self._read("samples", Sample)

    def list_history(self) -> list[HistoryItem]:
        return self._read("history", HistoryItem)

    def add_history(self, item: HistoryItem) -> HistoryItem:
        self._append("history", item, HistoryItem)
        return item

    def delete_history(self, item_id: str) -> None:
        self._delete("history", item_id, HistoryItem)

    def list_bench_samples(self) -> list[BenchSample]:
        return self._read("bench_samples", BenchSample)

    def add_bench_sample(self, sample: BenchSample) -> BenchSample:
        self._append("bench_samples", sample, BenchSample)
        return sample

    def delete_bench_sample(self, sample_id: str) -> None:
        self._delete("bench_samples", sample_id, BenchSample)

    def bench_stats(self) -> BenchStats:
        samples = self.list_bench_samples()
        if not samples:
            return BenchStats(sampleCount=0, ifwWer=0, appleWer=0, ifwMs=0, appleMs=0)
        count = len(samples)
        return BenchStats(
            sampleCount=count,
            ifwWer=round(sum(sample.ifwWer for sample in samples) / count, 2),
            appleWer=round(sum(sample.appleWer for sample in samples) / count, 2),
            ifwMs=round(sum(sample.ifwMs for sample in samples) / count),
            appleMs=round(sum(sample.appleMs for sample in samples) / count),
        )

    def list_vocab(self) -> list[VocabItem]:
        return self._read("vocab", VocabItem)

    def add_vocab(self, item: VocabItem) -> VocabItem:
        self._append("vocab", item, VocabItem)
        return item

    def delete_vocab(self, item_id: int) -> None:
        items = self.list_vocab()
        match = next((item for item in items if item.id == item_id), None)
        if match is None:
            raise StoreError(f"vocab item {item_id} not found")
        if match.builtin:
            raise StoreError(f"vocab item {item_id} is built in")
        self._write("vocab", tuple(item for item in items if item.id != item_id))

    def get_settings(self) -> Settings:
        rows = self._read("settings", Settings)
        if not rows:
            self._write("settings", (DEFAULT_SETTINGS,))
            return DEFAULT_SETTINGS
        return rows[0]

    def patch_settings(self, patch: SettingsPatch) -> Settings:
        current = self.get_settings()
        patched = current.model_copy(
            update={
                key: self._merge_model(getattr(current, key), value)
                for key, value in patch.model_dump(exclude_unset=True).items()
                if key != "tools"
            }
        )
        if patch.tools is not None:
            patched = patched.model_copy(update={"tools": patch.tools})
        self._write("settings", (Settings.model_validate(patched),))
        return Settings.model_validate(patched)

    def _path(self, resource: Resource) -> Path:
        return self.data_dir / FILE_NAMES[resource]

    def _read(self, resource: Resource, model: type[M]) -> list[M]:
        path = self._path(resource)
        if not path.exists():
            return []
        rows = pl.read_parquet(path).to_dicts()
        return [model.model_validate(self._decode_row(resource, row)) for row in rows]

    def _append(self, resource: Resource, item: M, model: type[M]) -> None:
        existing = self._read(resource, model)
        if any(getattr(row, "id", None) == getattr(item, "id", None) for row in existing):
            raise StoreError(f"{resource} item {getattr(item, 'id', '')} already exists")
        self._write(resource, (*existing, item))

    def _delete(self, resource: Resource, item_id: str, model: type[M]) -> None:
        existing = self._read(resource, model)
        remaining = tuple(row for row in existing if getattr(row, "id", None) != item_id)
        if len(remaining) == len(existing):
            raise StoreError(f"{resource} item {item_id} not found")
        self._write(resource, remaining)

    def _write(self, resource: Resource, rows: Sequence[BaseModel]) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        encoded_rows = [self._encode_row(resource, row) for row in rows]
        frame = pl.DataFrame(encoded_rows, schema=SCHEMAS[resource])
        frame.write_parquet(self._path(resource))

    def _encode_row(self, resource: Resource, row: BaseModel) -> dict[str, Any]:
        data = row.model_dump(mode="json")
        for column in JSON_COLUMNS[resource]:
            data[column] = json.dumps(data[column], ensure_ascii=False, separators=(",", ":"))
        return data

    def _decode_row(self, resource: Resource, row: dict[str, Any]) -> dict[str, Any]:
        data = dict(row)
        for column in JSON_COLUMNS[resource]:
            value = data[column]
            if isinstance(value, str):
                data[column] = json.loads(value)
        return data

    @staticmethod
    def _merge_model(current: BaseModel, patch: dict[str, Any] | None) -> BaseModel:
        if patch is None:
            return current
        return current.model_copy(
            update={key: value for key, value in patch.items() if value is not None}
        )
