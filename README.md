# whispr

> Local-first macOS voice-to-text studio — capture speech, transcribe on-device, format & route the result.

## Stack
- **Frontend:** React 18 + Vite + TypeScript
- **Backend:** Python 3.12 + FastAPI + uvicorn
- **Data:** Parquet files via Polars (migrate to SQL/Postgres later)
- **Infra:** Local (macOS) — no remote deploy

## Install
```bash
npm --prefix frontend install && uv sync
```

## Develop
Run the backend and frontend in two terminals:
```bash
uv run python -m whispr          # FastAPI backend on :8000
npm --prefix frontend run dev    # Vite dev server on :5173
```

## Test
```bash
uv run pytest && npm --prefix frontend test
```

## Build
```bash
npm --prefix frontend run build
```

## CLI
_No CLI commands yet._

## Recent updates
Last 5 entries from [CHANGELOG.md](./CHANGELOG.md):

<!-- BEGIN:RECENT-UPDATES -->
- (auto-populated by `scripts/done.py` once you ship something)
<!-- END:RECENT-UPDATES -->

## Project map
See [CLAUDE.md](./CLAUDE.md) (identical to [AGENTS.md](./AGENTS.md)) for the agent-readable map of this repo.

## Workflow
- Branches: `main` (prod, protected) ← `dev` (staging) ← `feature/*`
- Pre-commit: Prettier + ESLint via Husky
- CI: every PR runs lint / typecheck / test / build
- Deploy: local only — no remote deploy target
