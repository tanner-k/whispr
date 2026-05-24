"""Pydantic models shared by the API and the Parquet store."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

Format = Literal["prose", "markdown", "list", "check", "steps", "table", "email", "calendar"]
RouteTarget = Literal["clipboard", "paste", "file", "obsidian", "calendar"]
ToolStatus = Literal["pending", "done", "error"]
VocabTargetType = Literal["format", "tool"]
PermissionLevel = Literal["auto", "ask", "off"]
AudioRetention = Literal["30d", "7d", "1d", "never"]


class WhisprModel(BaseModel):
    """Base model with strict-ish API contract behavior."""

    model_config = ConfigDict(extra="forbid")


class ToolCall(WhisprModel):
    kind: str = Field(min_length=1)
    args: dict[str, Any]
    status: ToolStatus
    result: str | None


class FormatAlternate(WhisprModel):
    format: Format
    confidence: float = Field(ge=0, le=1)


class Sample(WhisprModel):
    id: str = Field(min_length=1)
    raw: str
    cleaned: str
    duration: float = Field(ge=0)
    sttMs: int = Field(ge=0)
    llmMs: int = Field(ge=0)
    format: Format
    confidence: float = Field(ge=0, le=1)
    title: str = Field(min_length=1)
    formatted: dict[Format, str]
    alternates: list[FormatAlternate]
    tools: list[ToolCall]
    routedTo: RouteTarget


class RawTranscript(WhisprModel):
    raw: str
    duration: float = Field(ge=0)
    sttMs: int = Field(ge=0)


class HistoryItem(WhisprModel):
    id: str = Field(min_length=1)
    when: str = Field(min_length=1)
    title: str = Field(min_length=1)
    format: Format
    preview: str
    durationS: int = Field(ge=0)
    totalMs: int = Field(ge=0)
    starred: bool
    route: RouteTarget


class BenchSample(WhisprModel):
    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    durationS: float = Field(ge=0)
    truth: str
    ifw: str
    apple: str
    ifwMs: int = Field(ge=0)
    appleMs: int = Field(ge=0)
    ifwWer: float = Field(ge=0)
    appleWer: float = Field(ge=0)


class BenchStats(WhisprModel):
    sampleCount: int = Field(ge=0)
    ifwWer: float = Field(ge=0)
    appleWer: float = Field(ge=0)
    ifwMs: int = Field(ge=0)
    appleMs: int = Field(ge=0)


class VocabTarget(WhisprModel):
    type: VocabTargetType
    value: str = Field(min_length=1)


class VocabItem(WhisprModel):
    id: int = Field(ge=1)
    phrase: str = Field(min_length=1)
    target: VocabTarget
    builtin: bool
    hits: int = Field(ge=0)


class ToolPermission(WhisprModel):
    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    desc: str
    perm: PermissionLevel


class TranscriptionSettings(WhisprModel):
    primaryEngine: str = Field(min_length=1)
    shadowEngine: str = Field(min_length=1)
    initialPrompt: str
    language: str = Field(min_length=1)


class ModelSettings(WhisprModel):
    runtime: str = Field(min_length=1)
    model: str = Field(min_length=1)
    contextWindow: int = Field(ge=1)
    temperature: float = Field(ge=0, le=1)
    multiAgent: bool


class PrivacySettings(WhisprModel):
    keepRawAudio: bool
    audioRetention: AudioRetention
    anonymousErrorReports: bool
    allowCloudFallback: bool


class Settings(WhisprModel):
    transcription: TranscriptionSettings
    model: ModelSettings
    privacy: PrivacySettings
    tools: list[ToolPermission]


class TranscriptionSettingsPatch(WhisprModel):
    primaryEngine: str | None = Field(default=None, min_length=1)
    shadowEngine: str | None = Field(default=None, min_length=1)
    initialPrompt: str | None = None
    language: str | None = Field(default=None, min_length=1)


class ModelSettingsPatch(WhisprModel):
    runtime: str | None = Field(default=None, min_length=1)
    model: str | None = Field(default=None, min_length=1)
    contextWindow: int | None = Field(default=None, ge=1)
    temperature: float | None = Field(default=None, ge=0, le=1)
    multiAgent: bool | None = None


class PrivacySettingsPatch(WhisprModel):
    keepRawAudio: bool | None = None
    audioRetention: AudioRetention | None = None
    anonymousErrorReports: bool | None = None
    allowCloudFallback: bool | None = None


class SettingsPatch(WhisprModel):
    transcription: TranscriptionSettingsPatch | None = None
    model: ModelSettingsPatch | None = None
    privacy: PrivacySettingsPatch | None = None
    tools: list[ToolPermission] | None = None


class HealthResponse(WhisprModel):
    status: Literal["ok"]
    version: str
    device: str
    sttModel: str
    llmModel: str
    dataDir: str
    devModelOverride: bool


class ApiEnvelope[T](BaseModel):
    success: bool
    data: T | None
    error: str | None


def ok[T](data: T) -> ApiEnvelope[T]:
    return ApiEnvelope(success=True, data=data, error=None)


def fail(error: str) -> ApiEnvelope[None]:
    return ApiEnvelope(success=False, data=None, error=error)
