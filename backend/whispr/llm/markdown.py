"""Markdown sectioning helpers for formatted captures."""

from __future__ import annotations

import importlib
import re
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, Protocol, cast


@dataclass(frozen=True, slots=True)
class MarkdownSectioningResult:
    """Markdown output plus formatter provenance."""

    markdown: str
    source: str
    used_fallback: bool


class MarkdownSectioner(Protocol):
    """Produces one Markdown document from cleaned transcript text."""

    def section(self, cleaned: str) -> MarkdownSectioningResult:
        """Return sectioned Markdown for cleaned transcript text."""


type MarkdownGenerator = Callable[[str], str]


class FallbackMarkdownSectioner:
    """Local deterministic Markdown sectioner used when LLM output is unavailable."""

    source = "fallback"

    def section(self, cleaned: str) -> MarkdownSectioningResult:
        return MarkdownSectioningResult(
            markdown=deterministic_markdown(cleaned),
            source=self.source,
            used_fallback=True,
        )


class LlmMarkdownSectioner:
    """LLM-backed Markdown sectioner with deterministic fallback validation."""

    def __init__(
        self,
        generate: MarkdownGenerator,
        fallback: MarkdownSectioner | None = None,
    ) -> None:
        self._generate = generate
        self._fallback = fallback or FallbackMarkdownSectioner()

    def section(self, cleaned: str) -> MarkdownSectioningResult:
        try:
            markdown = self._generate(cleaned).strip()
        except Exception:
            return self._fallback.section(cleaned)

        if not _valid_markdown(markdown):
            return self._fallback.section(cleaned)

        return MarkdownSectioningResult(
            markdown=markdown,
            source="llm",
            used_fallback=False,
        )


class LocalMarkdownGenerator:
    """Settings-backed local text-generation wrapper for Markdown sectioning."""

    def __init__(self, model_id: str, *, device: str) -> None:
        self.model_id = model_id
        self.device = device
        self._pipeline: Any | None = None

    def __call__(self, cleaned: str) -> str:
        if not _supports_transformers_generation(self.model_id):
            raise RuntimeError(f"unsupported local LLM model for transformers: {self.model_id}")

        pipe = self._load_pipeline()
        result = pipe(
            _sectioning_prompt(cleaned),
            max_new_tokens=512,
            do_sample=False,
            return_full_text=False,
        )
        generated = cast(str, result[0]["generated_text"])
        return generated.strip()

    def _load_pipeline(self) -> Any:
        if self._pipeline is None:
            transformers = cast(Any, importlib.import_module("transformers"))
            pipeline = transformers.pipeline
            self._pipeline = pipeline(
                "text-generation",
                model=self.model_id,
                device=_pipeline_device(self.device),
            )
        return self._pipeline


def create_markdown_sectioner(model_id: str, *, device: str) -> MarkdownSectioner:
    """Create the configured Markdown sectioner without hard-coding model paths."""
    return LlmMarkdownSectioner(LocalMarkdownGenerator(model_id, device=device))


def deterministic_markdown(cleaned: str) -> str:
    """Produce a conservative Markdown document from prose and list-like sentences."""
    text = cleaned.strip()
    blocks = _section_blocks(text)
    title = (
        _markdown_title(text)
        if any(_is_list_block(block) for block in blocks)
        else _legacy_title(text)
    )
    return f"## {title}\n\n" + "\n\n".join(blocks)


def _valid_markdown(markdown: str) -> bool:
    lines = [line.rstrip() for line in markdown.splitlines()]
    non_empty = [line for line in lines if line.strip()]
    if not non_empty:
        return False
    if not non_empty[0].startswith("#"):
        return False
    return (
        any(line.startswith(("- ", "- [ ] ", "1. ")) for line in non_empty)
        or len("\n".join(non_empty)) >= 12
    )


def _sectioning_prompt(text: str) -> str:
    return (
        "Format this transcript as concise Markdown. Preserve meaning, remove filler, "
        "and infer paragraphs, headings, bullet lists, checklists, or numbered lists when useful. "
        "Return only Markdown.\n\nTranscript:\n"
        f"{text}"
    )


def _supports_transformers_generation(model_id: str) -> bool:
    lowered = model_id.lower()
    return lowered != "dev/null-llm" and ".gguf" not in lowered and "gguf:" not in lowered


def _pipeline_device(device: str) -> int:
    return 0 if device in {"mps", "cuda"} else -1


def _section_blocks(text: str) -> list[str]:
    sentences = _sentences(text)
    blocks: list[str] = []
    paragraph: list[str] = []

    for sentence in sentences:
        list_block = _list_block(sentence)
        if list_block is None:
            paragraph.append(sentence)
            continue

        if paragraph:
            blocks.append(" ".join(paragraph))
            paragraph = []
        blocks.append(list_block)

    if paragraph:
        blocks.append(" ".join(paragraph))

    return blocks or [text]


def _sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [part.strip() for part in parts if part.strip()]


def _list_block(sentence: str) -> str | None:
    patterns: tuple[tuple[re.Pattern[str], str], ...] = (
        (
            re.compile(
                r"^(?:the\s+)?(?P<label>main risks|risks|blockers|open questions)\s+"
                r"(?:are|include|were)\s+(?P<items>.+)$",
                re.IGNORECASE,
            ),
            "bullet",
        ),
        (
            re.compile(
                r"^(?:for\s+)?(?P<label>next steps|next actions|action items|follow ups|"
                r"tasks|todo items)"
                r"\s+(?:i\s+)?(?:need to|should|are|include)\s+(?P<items>.+)$",
                re.IGNORECASE,
            ),
            "check",
        ),
        (
            re.compile(
                r"^(?:the\s+)?(?P<label>checklist|todo list)\s+(?:is|includes|should include)\s+"
                r"(?P<items>.+)$",
                re.IGNORECASE,
            ),
            "check",
        ),
    )

    stripped = sentence.strip().rstrip(".")
    for pattern, style in patterns:
        match = pattern.match(stripped)
        if not match:
            continue
        label = _clean_label(match.group("label"))
        items = _split_items(match.group("items"))
        if len(items) < 2:
            return None
        prefix = "- [ ] " if style == "check" else "- "
        return f"### {label}\n\n" + "\n".join(f"{prefix}{item}" for item in items)

    return None


def _split_items(text: str) -> list[str]:
    parts = re.split(r"(?:,|\band\b|\bthen\b)+", text, flags=re.IGNORECASE)
    return [_clean_item(part) for part in parts if part.strip(" .")]


def _clean_item(text: str) -> str:
    item = text.strip(" .")
    item = re.sub(r"^(?:to|and to)\s+", "", item, flags=re.IGNORECASE)
    if not item:
        return item
    return item[:1].upper() + item[1:]


def _clean_label(text: str) -> str:
    label = text.strip().replace("_", " ")
    return _headline(label)


def _markdown_title(text: str) -> str:
    about_match = re.search(
        r"\babout\s+(?:the\s+)?(?P<topic>[^.]+?)(?:\.|$)",
        text,
        re.IGNORECASE,
    )
    if about_match:
        return _headline(about_match.group("topic"))

    first_sentence = _sentences(text)[0] if _sentences(text) else text
    first_sentence = re.sub(r"\bupdate\b$", "", first_sentence.strip(" ."), flags=re.IGNORECASE)
    return _headline(first_sentence)


def _legacy_title(text: str) -> str:
    words = text.strip().split()
    if not words:
        return "Untitled capture"
    title = " ".join(words[:6]).rstrip(".,")
    return title[:1].upper() + title[1:]


def _headline(text: str) -> str:
    title = text.strip(" .") or "Untitled capture"
    words = title.split()
    small_words = {"a", "an", "and", "as", "for", "of", "on", "or", "the", "to"}
    titled = [
        word.lower() if index > 0 and word.lower() in small_words else _capitalize(word)
        for index, word in enumerate(words)
    ]
    return " ".join(titled)


def _capitalize(text: str) -> str:
    return text[:1].upper() + text[1:]


def _is_list_block(text: str) -> bool:
    return any(line.startswith(("- ", "- [ ] ", "1. ")) for line in text.splitlines())
