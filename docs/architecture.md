# Architecture — whispr

## One-line
Local-first macOS voice-to-text studio — capture speech, transcribe on-device, format & route the result.

## System diagram
```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   frontend   │ ───▶ │   backend    │ ───▶ │     data     │
│ React + Vite │  HTTP │ FastAPI/uv   │      │ Parquet/Polars│
└──────────────┘      └──────────────┘      └──────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │    infra     │
                      │ Local (macOS)│
                      └──────────────┘
```

> Replace this ASCII sketch with a real diagram (Excalidraw, Mermaid, etc.) once the shape settles.

## Components

### frontend
React 18 + Vite + TypeScript. See [`../frontend/context.md`](../frontend/context.md).

### backend
Python 3.12 + FastAPI + uvicorn. See [`../backend/context.md`](../backend/context.md).

### data
Parquet files via Polars (migrate to SQL/Postgres later). See [`../data/context.md`](../data/context.md).

### infra
Local (macOS) — no remote deploy. See [`../infra/context.md`](../infra/context.md).

## Decisions
See [`./decisions/`](./decisions/) for the running ADR log.

## Open questions
- (Track unresolved design questions here. Move to an ADR once decided.)
