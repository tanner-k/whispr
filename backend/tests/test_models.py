"""Validation tests for Whispr API models."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from whispr.models import HistoryItem, Sample, SettingsPatch
from whispr.seeds import DEMO_SAMPLES


def test_sample_matches_frontend_contract() -> None:
    sample = Sample.model_validate(DEMO_SAMPLES[0].model_dump(mode="json"))

    assert sample.id == "s1"
    assert sample.format == "check"
    assert sample.formatted["check"].startswith("- [ ] Milk")
    assert sample.routedTo == "clipboard"


def test_history_rejects_unknown_format() -> None:
    with pytest.raises(ValidationError):
        HistoryItem.model_validate(
            {
                "id": "h9",
                "when": "Today",
                "title": "Bad shape",
                "format": "pdf",
                "preview": "",
                "durationS": 1,
                "totalMs": 1,
                "starred": False,
                "route": "clipboard",
            }
        )


def test_settings_patch_allows_partial_nested_update() -> None:
    patch = SettingsPatch.model_validate({"model": {"temperature": 0.35}})

    assert patch.model is not None
    assert patch.model.temperature == 0.35
    assert patch.transcription is None
