/**
 * types.ts — TypeScript data shapes for Whispr Studio.
 *
 * Derived from the mock-data objects in the design prototype
 * (design-reference/voice-chat-app/project/*.jsx). Components and
 * views ported in T3–T5 consume these types; the backend (T6+)
 * returns them wrapped in {@link ApiEnvelope}.
 */

/* ─── Format ──────────────────────────────────────────────────────
 * String-literal union of output formats. Mirrors the keys of
 * FORMAT_META in studio-components.jsx. */
export type Format =
  | 'prose'
  | 'markdown'
  | 'list'
  | 'check'
  | 'steps'
  | 'table'
  | 'email'
  | 'calendar';

/* ─── Routing targets ─────────────────────────────────────────────
 * Where a captured sample can be sent (RoutingBar in studio-views.jsx). */
export type RouteTarget = 'clipboard' | 'paste' | 'file' | 'obsidian' | 'calendar';

/* ─── Tool calls ──────────────────────────────────────────────────
 * A tool invocation attached to a sample (DEMO_SAMPLES[].tools). */
export type ToolStatus = 'pending' | 'done' | 'error';

export interface ToolCall {
  /** Fully-qualified tool id, e.g. 'calendar.create_event'. */
  kind: string;
  /** Arbitrary tool arguments; shape varies per tool. */
  args: Record<string, unknown>;
  status: ToolStatus;
  /** Human-readable result once executed; null while pending. */
  result: string | null;
}

/* ─── Format alternates ───────────────────────────────────────────
 * A candidate format with the parser's confidence (0–1). */
export interface FormatAlternate {
  format: Format;
  confidence: number;
}

/* ─── Sample ──────────────────────────────────────────────────────
 * A single capture result. From DEMO_SAMPLES in studio-views.jsx. */
export interface Sample {
  id: string;
  /** Raw transcript, verbatim from STT. */
  raw: string;
  /** Cleaned transcript with the trailing format command stripped. */
  cleaned: string;
  /** Audio duration in seconds. */
  duration: number;
  /** Speech-to-text latency in milliseconds. */
  sttMs: number;
  /** LLM (cleanup + format) latency in milliseconds. */
  llmMs: number;
  /** The detected/selected output format. */
  format: Format;
  /** Parser confidence for {@link Sample.format} (0–1). */
  confidence: number;
  title: string;
  /** Rendered output per format. Partial — not every format is produced. */
  formatted: Partial<Record<Format, string>>;
  /** Ranked alternate formats with their confidences. */
  alternates: FormatAlternate[];
  /** Tool calls triggered by this sample (may be empty). */
  tools: ToolCall[];
  /** Where the sample is currently routed. */
  routedTo: RouteTarget;
}

/* ─── HistoryItem ─────────────────────────────────────────────────
 * A row in the History list. From HISTORY_ITEMS in studio-views.jsx. */
export interface HistoryItem {
  id: string;
  /** Human-readable timestamp label, e.g. 'Today · 10:14'. */
  when: string;
  title: string;
  format: Format;
  /** Short transcript preview. */
  preview: string;
  /** Audio duration in seconds. */
  durationS: number;
  /** End-to-end latency in milliseconds. */
  totalMs: number;
  starred: boolean;
  /** Route the sample was sent to. */
  route: RouteTarget;
}

/* ─── BenchSample ─────────────────────────────────────────────────
 * One clip in the A/B bench corpus. From BENCH_SAMPLES in studio-views.jsx. */
export interface BenchSample {
  id: string;
  /** Clip filename, e.g. 'meeting-clip-3.wav'. */
  title: string;
  /** Audio duration in seconds. */
  durationS: number;
  /** Ground-truth transcript. */
  truth: string;
  /** insanely-fast-whisper transcript. */
  ifw: string;
  /** Apple Speech transcript. */
  apple: string;
  /** insanely-fast-whisper latency in milliseconds. */
  ifwMs: number;
  /** Apple Speech latency in milliseconds. */
  appleMs: number;
  /** insanely-fast-whisper word error rate (percentage). */
  ifwWer: number;
  /** Apple Speech word error rate (percentage). */
  appleWer: number;
}

/* ─── VocabItem ───────────────────────────────────────────────────
 * A trigger phrase the parser listens for. From VOCAB_INITIAL in
 * studio-views.jsx. */
export type VocabTargetType = 'format' | 'tool';

export interface VocabTarget {
  type: VocabTargetType;
  /** A Format key when type is 'format', a tool id when type is 'tool'. */
  value: string;
}

export interface VocabItem {
  /** Numeric id (Date.now() for user-added entries). */
  id: number;
  /** The trigger phrase, e.g. 'format as markdown'. */
  phrase: string;
  target: VocabTarget;
  /** True for shipped built-in phrases (not user-removable). */
  builtin: boolean;
  /** Number of times this phrase has matched. */
  hits: number;
}

/* ─── ToolPermission ──────────────────────────────────────────────
 * A per-tool permission row. From the SettingsTools initial array
 * in studio-views.jsx. */
export type PermissionLevel = 'auto' | 'ask' | 'off';

export interface ToolPermission {
  /** Tool id, e.g. 'calendar.create_event'. */
  id: string;
  label: string;
  desc: string;
  perm: PermissionLevel;
}

/* ─── Settings ────────────────────────────────────────────────────
 * Configurable values surfaced by the Settings view. The prototype
 * uses uncontrolled inputs with hard-coded defaults; this shape is
 * the structured contract the backend (T6+) will persist. */
export interface Settings {
  transcription: {
    /** Primary STT engine identifier. */
    primaryEngine: string;
    /** Shadow STT engine run in parallel for the bench. */
    shadowEngine: string;
    /** Optional whisper initial prompt (jargon context). */
    initialPrompt: string;
    /** Language code, or 'auto' to detect per clip. */
    language: string;
  };
  model: {
    /** Inference runtime, e.g. 'llama.cpp'. */
    runtime: string;
    /** Selected GGUF model id. */
    model: string;
    /** Context window size in tokens. */
    contextWindow: number;
    /** Sampling temperature (0–1). */
    temperature: number;
    /** Experimental multi-agent pipeline toggle. */
    multiAgent: boolean;
  };
  privacy: {
    /** Retain raw .wav files alongside transcripts. */
    keepRawAudio: boolean;
    /** Audio retention window, e.g. '30d' | '7d' | '1d' | 'never'. */
    audioRetention: string;
    /** Send anonymous stack-trace-only error reports. */
    anonymousErrorReports: boolean;
    /** Allow tools that require the internet. */
    allowCloudFallback: boolean;
  };
  /** Per-tool permission settings. */
  tools: ToolPermission[];
}

/* ─── ApiEnvelope ─────────────────────────────────────────────────
 * Generic response envelope used by the backend. On success `data`
 * is populated and `error` is null; on failure the reverse. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}
