"""Parser and deterministic formatter tests."""

from __future__ import annotations

from whispr.llm.markdown import LlmMarkdownSectioner
from whispr.llm.parser import build_sample, format_transcript, parse_transcript

LONG_MARKDOWN_TRANSCRIPT = (
    "Launch readiness update. The launch work is on track and the team finished the "
    "accessibility pass this morning. Risks are billing webhook retries, pricing copy "
    "approval, and support coverage for the first weekend. Format as markdown."
)

NEXT_ACTIONS_MARKDOWN_TRANSCRIPT = (
    "Customer onboarding sync. We agreed to keep the pilot narrow for the first week. "
    "Next actions are Sarah drafts the migration notes, Omar confirms support coverage, "
    "and I will send the launch summary. Format as markdown."
)


def test_parse_transcript_detects_markdown_command() -> None:
    parsed = parse_transcript("Ship onboarding notes and risks. Format as markdown.")

    assert parsed.raw == "Ship onboarding notes and risks. Format as markdown."
    assert parsed.cleaned == "Ship onboarding notes and risks."
    assert parsed.format == "markdown"
    assert parsed.command == "Format as markdown."
    assert parsed.confidence == 0.88


def test_format_transcript_strips_markdown_command_from_long_transcript() -> None:
    result = format_transcript(LONG_MARKDOWN_TRANSCRIPT)

    assert result.type == "markdown"
    assert result.cleaned_text == (
        "Launch readiness update. The launch work is on track and the team finished the "
        "accessibility pass this morning. Risks are billing webhook retries, pricing copy "
        "approval, and support coverage for the first weekend."
    )
    assert result.command == "Format as markdown."
    assert "Format as markdown" not in result.formatted_text


def test_format_transcript_sections_long_markdown_with_prose_and_inferred_list() -> None:
    result = format_transcript(LONG_MARKDOWN_TRANSCRIPT)

    assert result.type == "markdown"
    assert "## Launch Readiness" in result.formatted_text
    assert (
        "The launch work is on track and the team finished the accessibility pass this morning."
        in result.formatted_text
    )
    assert "## Risks" in result.formatted_text or "### Risks" in result.formatted_text
    assert "- Billing webhook retries" in result.formatted_text
    assert "- Pricing copy approval" in result.formatted_text
    assert "- Support coverage for the first weekend" in result.formatted_text


def test_format_transcript_sections_markdown_next_actions_as_task_list_or_steps() -> None:
    result = format_transcript(NEXT_ACTIONS_MARKDOWN_TRANSCRIPT)

    assert result.type == "markdown"
    assert "## Next Actions" in result.formatted_text or "### Next Actions" in result.formatted_text
    assert (
        "- [ ] Sarah drafts the migration notes" in result.formatted_text
        or "1. Sarah drafts the migration notes" in result.formatted_text
    )
    assert (
        "- [ ] Omar confirms support coverage" in result.formatted_text
        or "2. Omar confirms support coverage" in result.formatted_text
    )
    assert (
        "- [ ] I will send the launch summary" in result.formatted_text
        or "3. I will send the launch summary" in result.formatted_text
    )


def test_format_transcript_uses_valid_llm_markdown_sectioner_output() -> None:
    sectioner = LlmMarkdownSectioner(
        lambda _cleaned: "## Custom Note\n\nSummary paragraph.\n\n- First\n- Second"
    )

    result = format_transcript(
        "A longer note that should be modeled. Format as markdown.",
        markdown_sectioner=sectioner,
    )

    assert result.formatted_text == "## Custom Note\n\nSummary paragraph.\n\n- First\n- Second"


def test_format_transcript_falls_back_when_llm_markdown_is_invalid() -> None:
    sectioner = LlmMarkdownSectioner(lambda _cleaned: "")

    result = format_transcript(
        "Just save this thought for the team. Format as markdown.",
        markdown_sectioner=sectioner,
    )

    assert result.formatted_text == (
        "## Just save this thought for the\n\nJust save this thought for the team."
    )


def test_format_transcript_falls_back_when_llm_markdown_raises() -> None:
    def raise_error(_cleaned: str) -> str:
        raise RuntimeError("model unavailable")

    result = format_transcript(
        "Just save this thought for the team. Format as markdown.",
        markdown_sectioner=LlmMarkdownSectioner(raise_error),
    )

    assert result.formatted_text == (
        "## Just save this thought for the\n\nJust save this thought for the team."
    )


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


def test_format_transcript_markdown_falls_back_to_simple_heading_for_short_note() -> None:
    result = format_transcript("Just save this thought for the team. Format as markdown.")

    assert result.type == "markdown"
    assert result.cleaned_text == "Just save this thought for the team."
    assert result.formatted_text == (
        "## Just save this thought for the\n\nJust save this thought for the team."
    )


def test_format_transcript_non_markdown_formats_keep_existing_behavior() -> None:
    checklist = format_transcript("Milk, eggs, and bread. Format as checklist.")
    steps = format_transcript("Install dependencies, run tests, and ship it. Format as steps.")

    assert checklist.type == "check"
    assert checklist.formatted_text == "- [ ] Milk\n- [ ] Eggs\n- [ ] Bread"
    assert steps.type == "steps"
    assert steps.formatted_text == "1. Install dependencies\n2. Run tests\n3. Ship it"


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
