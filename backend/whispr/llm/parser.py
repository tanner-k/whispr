"""Regex fast-path parser and deterministic formatter."""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass

from whispr.models import Format, FormatAlternate, Sample

from .markdown import FallbackMarkdownSectioner, MarkdownSectioner

FORMAT_COMMANDS: tuple[tuple[re.Pattern[str], Format], ...] = (
    (
        re.compile(
            r"\b(?:please\s+)?format (?:this )?as (?:a |an )?"
            r"(markdown|md)\s*(?:please)?[.!?]*$",
            re.IGNORECASE,
        ),
        "markdown",
    ),
    (
        re.compile(
            r"\b(?:please\s+)?format (?:this )?as (?:a |an )?"
            r"(checklist|check\s?list)\s*(?:please)?[.!?]*$",
            re.IGNORECASE,
        ),
        "check",
    ),
    (
        re.compile(
            r"\b(?:please\s+)?(?:make|create) (?:it |this |a |an )?(?:a |an )?"
            r"(checklist|check\s?list|todo)\s*(?:please)?[.!?]*$",
            re.IGNORECASE,
        ),
        "check",
    ),
    (
        re.compile(
            r"\b(?:please\s+)?format (?:this )?as (?:a |an )?"
            r"(list|bullet points|bullets)\s*(?:please)?[.!?]*$",
            re.IGNORECASE,
        ),
        "list",
    ),
    (
        re.compile(
            r"\b(?:please\s+)?(?:make|create) (?:it |this |a |an )?"
            r"(list|bullet points|bullets)\s*(?:please)?[.!?]*$",
            re.IGNORECASE,
        ),
        "list",
    ),
    (
        re.compile(
            r"\b(?:please\s+)?format (?:this )?as (?:a |an )?"
            r"table\s*(?:please)?[.!?]*$",
            re.IGNORECASE,
        ),
        "table",
    ),
    (
        re.compile(
            r"\b(?:please\s+)?(?:make|create) (?:it |this |a |an )?"
            r"table\s*(?:please)?[.!?]*$",
            re.IGNORECASE,
        ),
        "table",
    ),
    (
        re.compile(
            r"\b(?:please\s+)?format (?:this )?as (?:a |an )?"
            r"steps\s*(?:please)?[.!?]*$",
            re.IGNORECASE,
        ),
        "steps",
    ),
    (
        re.compile(
            r"\b(?:please\s+)?format (?:this )?as (?:a |an )?"
            r"email\s*(?:please)?[.!?]*$",
            re.IGNORECASE,
        ),
        "email",
    ),
    (
        re.compile(
            r"\b(?:please\s+)?format (?:this )?as (?:a |an )?"
            r"prose\s*(?:please)?[.!?]*$",
            re.IGNORECASE,
        ),
        "prose",
    ),
    (
        re.compile(
            r"\b(?:please\s+)?add (?:it |this )?to (?:my )?"
            r"calendar\s*(?:please)?[.!?]*$",
            re.IGNORECASE,
        ),
        "calendar",
    ),
)

LEADING_FORMAT_REQUESTS: tuple[tuple[re.Pattern[str], Format], ...] = (
    (
        re.compile(
            r"^(?P<command>(?:please\s+)?(?:help me\s+)?(?:make|create)\s+(?:me\s+)?"
            r"(?:a\s+)?(?:grocery\s+)?(?:list|bullet list|bulleted list)"
            r"(?:\s+(?:of|from|with)\s+"
            r"(?:these things|these items|the following|this stuff))?)"
            r"\s*[:.;,-]*\s+(?P<body>.+)$",
            re.IGNORECASE,
        ),
        "list",
    ),
)

CONFIDENCE = 0.88
STRUCTURED_SOURCE = "regex"
ITEM_PHRASES: tuple[str, ...] = (
    "beef broth",
    "chicken broth",
    "coffee filters",
    "trash bags",
    "eggs",
    "bread",
    "milk",
    "cheese",
    "fish",
    "chicken",
)
ALL_FORMATS: tuple[Format, ...] = (
    "prose",
    "markdown",
    "list",
    "check",
    "steps",
    "table",
    "email",
    "calendar",
)
MARKDOWN_SECTIONER = FallbackMarkdownSectioner()


@dataclass(frozen=True, slots=True)
class ParsedTranscript:
    """Intent parsed from an STT transcript."""

    raw: str
    cleaned: str
    format: Format
    confidence: float
    command: str | None


@dataclass(frozen=True, slots=True)
class FormatResult:
    """Structured deterministic formatting result, ready for Gemma review."""

    type: Format
    raw_text: str
    cleaned_text: str
    formatted_text: str
    confidence: float
    source: str
    command: str | None


def parse_transcript(raw: str) -> ParsedTranscript:
    """Detect a trailing formatting command and strip it from cleaned text."""
    normalized = " ".join(raw.strip().split())
    detected: Format = "prose"
    command: str | None = None
    command_start: int | None = None

    for pattern, fmt in LEADING_FORMAT_REQUESTS:
        match = pattern.search(normalized)
        if match:
            return ParsedTranscript(
                raw=normalized,
                cleaned=match.group("body").strip(" ,;:-"),
                format=fmt,
                confidence=CONFIDENCE,
                command=match.group("command").strip(),
            )

    for pattern, fmt in FORMAT_COMMANDS:
        match = pattern.search(normalized)
        if match:
            detected = fmt
            command_start = match.start()
            command = normalized[match.start() :].strip()
            break

    cleaned = normalized
    if command_start is not None:
        cleaned = normalized[:command_start].strip()
        cleaned = cleaned.rstrip(" ,;:-")

    return ParsedTranscript(
        raw=normalized,
        cleaned=cleaned or normalized,
        format=detected,
        confidence=CONFIDENCE if command else 0.62,
        command=command,
    )


def format_transcript(
    raw: str,
    *,
    markdown_sectioner: MarkdownSectioner = MARKDOWN_SECTIONER,
) -> FormatResult:
    """Parse intent and produce the structured formatter contract."""
    parsed = parse_transcript(raw)
    return FormatResult(
        type=parsed.format,
        raw_text=parsed.raw,
        cleaned_text=parsed.cleaned,
        formatted_text=_format_text(parsed.cleaned, parsed.format, markdown_sectioner),
        confidence=parsed.confidence,
        source=STRUCTURED_SOURCE,
        command=parsed.command,
    )


def build_sample(
    raw: str,
    *,
    duration: float,
    stt_ms: int,
    llm_ms: int,
    markdown_sectioner: MarkdownSectioner = MARKDOWN_SECTIONER,
) -> Sample:
    """Build a UI-ready sample from STT text using deterministic formatting."""
    result = format_transcript(raw, markdown_sectioner=markdown_sectioner)
    formatted = _formatted_outputs(result.cleaned_text, markdown_sectioner)
    formatted[result.type] = result.formatted_text
    title = _title(result.cleaned_text)
    return Sample(
        id=f"s-{uuid.uuid4().hex[:12]}",
        raw=result.raw_text,
        cleaned=result.cleaned_text,
        duration=round(duration, 1),
        sttMs=stt_ms,
        llmMs=llm_ms,
        format=result.type,
        confidence=result.confidence,
        title=title,
        formatted=formatted,
        alternates=_alternates(result.type, result.confidence),
        tools=[],
        routedTo="clipboard",
    )


def _formatted_outputs(
    cleaned: str,
    markdown_sectioner: MarkdownSectioner,
) -> dict[Format, str]:
    return {fmt: _format_text(cleaned, fmt, markdown_sectioner) for fmt in ALL_FORMATS}


def _format_text(cleaned: str, fmt: Format, markdown_sectioner: MarkdownSectioner) -> str:
    items = _items(cleaned)
    first = _title(cleaned)
    if fmt == "prose":
        return cleaned
    if fmt == "markdown":
        return markdown_sectioner.section(cleaned).markdown
    if fmt == "list":
        return "\n".join(f"- {item}" for item in items)
    if fmt == "check":
        return "\n".join(f"- [ ] {item}" for item in items)
    if fmt == "steps":
        return "\n".join(f"{index}. {item}" for index, item in enumerate(items, start=1))
    if fmt == "table":
        return "| Item |\n| --- |\n" + "\n".join(f"| {item} |" for item in items)
    if fmt == "email":
        return f"Subject: {first}\n\n{cleaned}"
    return cleaned


def _items(text: str) -> list[str]:
    parts = re.split(r"(?:,|\band\b|\n)+", text, flags=re.IGNORECASE)
    if len(parts) > 1:
        items = [_clean_item(part) for part in parts if part.strip(" .")]
        return items or [_clean_item(text)]

    lexicon_items = _items_from_phrase_lexicon(text)
    if lexicon_items:
        return lexicon_items

    return [_clean_item(text)]


def _items_from_phrase_lexicon(text: str) -> list[str]:
    remaining = text.strip(" .").lower()
    items: list[str] = []
    while remaining:
        remaining = remaining.strip()
        match = next(
            (phrase for phrase in ITEM_PHRASES if remaining.startswith(phrase)),
            None,
        )
        if match is None:
            return []
        items.append(_clean_item(match))
        remaining = remaining[len(match) :]
    return items


def _clean_item(text: str) -> str:
    item = text.strip(" .")
    if not item:
        return item
    return item[:1].upper() + item[1:]


def _title(text: str) -> str:
    words = text.strip().split()
    if not words:
        return "Untitled capture"
    title = " ".join(words[:6]).rstrip(".,")
    return title[:1].upper() + title[1:]


def _alternates(selected: Format, confidence: float) -> list[FormatAlternate]:
    fallback: tuple[Format, ...] = ("prose", "markdown", "list", "check")
    ordered = [selected, *(fmt for fmt in fallback if fmt != selected)]
    scores = [confidence, 0.58, 0.42, 0.25]
    return [
        FormatAlternate(format=fmt, confidence=score)
        for fmt, score in zip(ordered[:4], scores, strict=True)
    ]
