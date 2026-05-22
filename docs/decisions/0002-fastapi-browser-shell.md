# 0002 — FastAPI backend + browser-served React app

**Status:** Accepted
**Date:** 2026-05-22

## Context
The original design exploration for Whispr Studio sketched a native desktop
shell (pywebview wrapping the React UI). We need to decide how to actually
ship v1: as a pywebview desktop app, or as a FastAPI backend serving a React
app that runs in the browser.

## Decision
Ship Whispr Studio as a **FastAPI backend + React app served in the browser**,
rather than the pywebview desktop shell the original design exploration
suggested.

## Rationale
- **Easier dev/testing** — the frontend and backend run as ordinary processes
  with standard tooling (Vite dev server, uvicorn, `httpx` tests). No native
  webview to debug or package.
- **Standard** — an HTTP API + SPA is a well-understood architecture with
  abundant docs, libraries, and CI patterns.
- **Portfolio-legible** — a conventional client/server split is immediately
  readable to reviewers and collaborators.
- **Can be wrapped later** — nothing here precludes wrapping the same React app
  in pywebview, Tauri, or Electron down the line; the API boundary stays the
  same.

## Consequences
- (positive) Fast iteration; testable HTTP surface; conventional architecture.
- (tradeoff) v1 is not a true single-window native app — users open it in a
  browser tab. A native shell becomes a future enhancement, not a v1 feature.
- (followup) If a native shell is wanted, add an ADR covering the wrapper
  choice (pywebview / Tauri / Electron).

## Alternatives considered
- **pywebview desktop shell** — closer to the original design vision and a more
  "app-like" feel, but adds packaging/debugging complexity and platform-native
  edge cases that slow down v1. Deferred, not rejected.
