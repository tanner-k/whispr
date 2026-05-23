"""Round-trip tests for the Polars/Parquet store."""

from __future__ import annotations

from pathlib import Path

from whispr.config import DEFAULT_LLM_MODEL, DEFAULT_STT_MODEL, AppSettings
from whispr.models import HistoryItem, SettingsPatch, VocabItem
from whispr.seeds import BENCH_SAMPLES, DEMO_SAMPLES, HISTORY_ITEMS, VOCAB_INITIAL
from whispr.store import ParquetStore


def make_settings(tmp_path: Path) -> AppSettings:
    return AppSettings(
        repo_root=tmp_path,
        data_dir=tmp_path / "data",
        frontend_dist=tmp_path / "dist",
        stt_model=DEFAULT_STT_MODEL,
        llm_model=DEFAULT_LLM_MODEL,
        device="cpu",
        cors_origins=("http://testserver",),
        dev_model_override=False,
    )


def test_seed_if_needed_writes_all_parquet_resources(tmp_path: Path) -> None:
    store = ParquetStore(make_settings(tmp_path))
    store.seed_if_needed()

    assert len(store.list_samples()) == len(DEMO_SAMPLES)
    assert len(store.list_history()) == len(HISTORY_ITEMS)
    assert len(store.list_bench_samples()) == len(BENCH_SAMPLES)
    assert len(store.list_vocab()) == len(VOCAB_INITIAL)
    assert store.get_settings().model.model == DEFAULT_LLM_MODEL
    for name in ("samples", "history", "bench", "vocab", "settings"):
        assert (tmp_path / "data" / f"{name}.parquet").exists()


def test_history_round_trip_uses_append_pattern(tmp_path: Path) -> None:
    store = ParquetStore(make_settings(tmp_path))
    store.seed_if_needed()
    item = HistoryItem(
        id="h-new",
        when="Today · 12:00",
        title="New capture",
        format="prose",
        preview="A new capture",
        durationS=5,
        totalMs=500,
        starred=False,
        route="clipboard",
    )

    store.add_history(item)
    assert store.list_history()[-1] == item

    store.delete_history("h-new")
    assert all(row.id != "h-new" for row in store.list_history())


def test_vocab_round_trip_and_settings_patch(tmp_path: Path) -> None:
    store = ParquetStore(make_settings(tmp_path))
    store.seed_if_needed()
    vocab = VocabItem(
        id=100,
        phrase="ship as table",
        target={"type": "format", "value": "table"},
        builtin=False,
        hits=0,
    )

    store.add_vocab(vocab)
    assert store.list_vocab()[-1] == vocab

    settings = store.patch_settings(
        SettingsPatch.model_validate(
            {"model": {"temperature": 0.4}, "privacy": {"audioRetention": "7d"}}
        )
    )
    assert settings.model.temperature == 0.4
    assert settings.privacy.audioRetention == "7d"

    store.delete_vocab(100)
    assert all(row.id != 100 for row in store.list_vocab())


def test_bench_stats_are_derived_from_samples(tmp_path: Path) -> None:
    store = ParquetStore(make_settings(tmp_path))
    store.seed_if_needed()

    stats = store.bench_stats()

    assert stats.sampleCount == len(BENCH_SAMPLES)
    assert stats.ifwMs == 370
    assert stats.appleMs == 590
