"""Parser and deterministic formatter tests."""

from __future__ import annotations

from whispr.llm.parser import build_sample, format_transcript, parse_transcript


def test_parse_transcript_detects_markdown_command() -> None:
    parsed = parse_transcript("Ship onboarding notes and risks. Format as markdown.")

    assert parsed.raw == "Ship onboarding notes and risks. Format as markdown."
    assert parsed.cleaned == "Ship onboarding notes and risks."
    assert parsed.format == "markdown"
    assert parsed.command == "Format as markdown."
    assert parsed.confidence == 0.88


def test_parse_transcript_detects_checklist_command() -> None:
    parsed = parse_transcript("Milk, eggs, bread, and coffee filters. Make a checklist.")

    assert parsed.cleaned == "Milk, eggs, bread, and coffee filters."
    assert parsed.format == "check"


def test_parse_transcript_defaults_to_prose_without_command() -> None:
    parsed = parse_transcript("Just a plain note for later.")

    assert parsed.cleaned == "Just a plain note for later."
    assert parsed.format == "prose"
    assert parsed.command is None
    assert parsed.confidence == 0.62


def test_parse_transcript_ignores_non_trailing_command_phrase() -> None:
    raw = "Please explain how to format as markdown in Slack tomorrow."

    parsed = parse_transcript(raw)

    assert parsed.raw == raw
    assert parsed.cleaned == raw
    assert parsed.format == "prose"
    assert parsed.command is None


def test_parse_transcript_strips_leading_please_in_trailing_command() -> None:
    parsed = parse_transcript("Ship notes. Please format as markdown.")

    assert parsed.cleaned == "Ship notes."
    assert parsed.format == "markdown"
    assert parsed.command == "Please format as markdown."


def test_parse_transcript_command_only_falls_back_to_raw() -> None:
    parsed = parse_transcript("Please format as markdown.")

    assert parsed.raw == "Please format as markdown."
    assert parsed.cleaned == "Please format as markdown."
    assert parsed.format == "markdown"


def test_parse_transcript_detects_leading_list_request() -> None:
    parsed = parse_transcript(
        "Help me make a list of these things. Eggs, bread, milk, cheese, fish, chicken, beef broth."
    )

    assert parsed.cleaned == "Eggs, bread, milk, cheese, fish, chicken, beef broth."
    assert parsed.format == "list"
    assert parsed.command == "Help me make a list of these things"
    assert parsed.confidence == 0.88


def test_parse_transcript_leading_list_request_formats_items() -> None:
    sample = build_sample(
        "Help me make a list of these things: Eggs, bread, milk, cheese, fish, chicken, "
        "beef broth.",
        duration=2.0,
        stt_ms=1,
        llm_ms=1,
    )

    assert sample.format == "list"
    assert sample.formatted["list"] == (
        "- Eggs\n- Bread\n- Milk\n- Cheese\n- Fish\n- Chicken\n- Beef broth"
    )


def test_format_transcript_returns_structured_result_for_bare_list_request() -> None:
    result = format_transcript("Make a list eggs bread milk cheese fish chicken beef broth")

    assert result.type == "list"
    assert result.raw_text == "Make a list eggs bread milk cheese fish chicken beef broth"
    assert result.cleaned_text == "eggs bread milk cheese fish chicken beef broth"
    assert result.formatted_text == (
        "- Eggs\n- Bread\n- Milk\n- Cheese\n- Fish\n- Chicken\n- Beef broth"
    )
    assert result.confidence == 0.88
    assert result.source == "regex"
    assert result.command == "Make a list"


def test_parse_transcript_does_not_treat_explanatory_list_phrase_as_command() -> None:
    raw = "Please explain how to make a list in React tomorrow."

    parsed = parse_transcript(raw)

    assert parsed.cleaned == raw
    assert parsed.format == "prose"
    assert parsed.command is None


def test_build_sample_populates_formatted_outputs_and_alternates() -> None:
    sample = build_sample(
        "Milk, eggs, and bread. Format as checklist.",
        duration=3.2,
        stt_ms=42,
        llm_ms=7,
    )

    assert sample.cleaned == "Milk, eggs, and bread."
    assert sample.format == "check"
    assert sample.formatted["check"] == "- [ ] Milk\n- [ ] Eggs\n- [ ] Bread"
    assert sample.alternates[0].format == "check"
    assert sample.sttMs == 42
    assert sample.llmMs == 7
