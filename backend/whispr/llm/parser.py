"""Regex fast-path parser and deterministic formatter."""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass

from whispr.models import Format, FormatAlternate, Sample

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

CONFIDENCE = 0.88


@dataclass(frozen=True, slots=True)
class ParsedTranscript:
    """Intent parsed from an STT transcript."""

    raw: str
    cleaned: str
    format: Format
    confidence: float
    command: str | None


def parse_transcript(raw: str) -> ParsedTranscript:
    """Detect a trailing formatting command and strip it from cleaned text."""
    normalized = " ".join(raw.strip().split())
    detected: Format = "prose"
    command: str | None = None
    command_start: int | None = None

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


def build_sample(raw: str, *, duration: float, stt_ms: int, llm_ms: int) -> Sample:
    """Build a UI-ready sample from STT text using deterministic formatting."""
    parsed = parse_transcript(raw)
    formatted = _formatted_outputs(parsed.cleaned)
    selected = formatted.get(parsed.format, parsed.cleaned)
    formatted[parsed.format] = selected
    title = _title(parsed.cleaned)
    return Sample(
        id=f"s-{uuid.uuid4().hex[:12]}",
        raw=parsed.raw,
        cleaned=parsed.cleaned,
        duration=round(duration, 1),
        sttMs=stt_ms,
        llmMs=llm_ms,
        format=parsed.format,
        confidence=parsed.confidence,
        title=title,
        formatted=formatted,
        alternates=_alternates(parsed.format, parsed.confidence),
        tools=[],
        routedTo="clipboard",
    )


def _formatted_outputs(cleaned: str) -> dict[Format, str]:
    items = _items(cleaned)
    first = _title(cleaned)
    return {
        "prose": cleaned,
        "markdown": f"## {first}\n\n{cleaned}",
        "list": "\n".join(f"- {item}" for item in items),
        "check": "\n".join(f"- [ ] {item}" for item in items),
        "steps": "\n".join(f"{index}. {item}" for index, item in enumerate(items, start=1)),
        "table": "| Item |\n| --- |\n" + "\n".join(f"| {item} |" for item in items),
        "email": f"Subject: {first}\n\n{cleaned}",
        "calendar": cleaned,
    }


def _items(text: str) -> list[str]:
    parts = re.split(r"(?:,|\band\b|\n)+", text, flags=re.IGNORECASE)
    items = [part.strip(" .") for part in parts if part.strip(" .")]
    return items or [text]


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
