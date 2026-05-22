# 0001 — Initial stack

**Status:** Accepted
**Date:** 2026-05-22

## Context
Day-one decision: pick the stack for whispr.

## Decision
- **Frontend:** React 18 + Vite + TypeScript
- **Backend:** Python 3.12 + FastAPI + uvicorn
- **Data:** Parquet files via Polars (migrate to SQL/Postgres later)
- **Infra:** Local (macOS) — no remote deploy
- **Package manager:** `npm` (frontend) · `uv` (backend)
- **Node version:** 22

## Rationale
Python backend chosen for on-device ML (whisper/llama.cpp); React+Vite to faithfully rebuild the exported design prototype; Parquet+Polars as a zero-infrastructure local data layer, to migrate to SQL/Postgres later.

## Consequences
- (positive) Stack is familiar to the team / fits the deployment target / has good ecosystem
- (tradeoff) Locks us into the language/runtime — switching costs grow with code volume
- (followup) ADRs 0002+ will refine specific library choices within this stack

## Alternatives considered
- (briefly note what else was on the table and why it lost)
