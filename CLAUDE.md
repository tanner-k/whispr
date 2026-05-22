# Project Map — whispr

> **`CLAUDE.md` and `AGENTS.md` are identical.** Keep both in sync — update in the same commit.  
> This file is the entry-point for any AI agent working in this repo.

## 1. What this project is
Local-first macOS voice-to-text studio — capture speech, transcribe on-device, format & route the result.

## 2. Working state
A project is "working" when **all** of the following are true:

- ruff + eslint clean
- pytest + vitest green
- capture flow works end-to-end
- no lingering `- [x]` lines in `TODO.md`

> Default if unsure: `npm run lint` clean · `npm test` green · `dev` branch deploys to staging without error · no `- [x]` lines linger in `TODO.md` (they should have been promoted to `CHANGELOG.md`).

## 3. Project map
```
whispr/
├── README.md              ← what the project is + how to run it
├── CLAUDE.md              ← this file (AI agent context)
├── AGENTS.md              ← identical copy of CLAUDE.md
├── TODO.md                ← open work; check off + promote when done
├── CHANGELOG.md           ← shipped work, newest first
├── pyproject.toml         ← Python project + tooling config (uv)
├── .editorconfig          ← editor defaults
├── .prettierrc            ← format rules
├── .eslintrc.json         ← lint rules
├── .gitignore
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       └── ci.yml             ← every PR (Node + Python + docs-sync)
├── .husky/                ← git hooks
│   └── pre-commit             ← lint-staged
├── scripts/
│   └── done.py            ← promotes TODO line → CHANGELOG entry
├── design-reference/      ← exported design prototype (read-only reference)
├── frontend/              ← UI · see context.md
│   └── src/
├── backend/               ← API + business logic · see context.md
│   └── whispr/            ← Python package root
├── data/                  ← schemas, migrations, seeds · see context.md
├── infra/                 ← terraform, deploy scripts · see context.md
└── docs/
    ├── context.md
    ├── architecture.md
    └── decisions/         ← one ADR per architectural decision
        ├── 0001-stack.md
        ├── 0002-fastapi-browser-shell.md
        └── 0003-parquet-polars-data-layer.md
```

## 4. Where to do what
| If you're working on... | Go to... | Read first |
|---|---|---|
| UI component, page, route | `frontend/` | `frontend/context.md` |
| API endpoint, business logic | `backend/` | `backend/context.md` |
| Schema, migration, seed | `data/` | `data/context.md` |
| Terraform, deploy script | `infra/` | `infra/context.md` |
| Architecture decision | `docs/decisions/` | latest ADR |
| Workflow / process question | `CLAUDE.md` (here) | this file |

## 5. Global skills / MCPs
Apply across the whole repo:

- None yet — add as needed

> Folder-specific skills live in each `context.md`.

## 6. Workflow rules
1. **Branches:** `main` = prod (protected). `dev` = staging. All PRs target `dev`. `dev` → `main` is a release.
2. **TODOs:** Add as `- [ ] …` in `TODO.md`. When complete, run `python3 scripts/done.py "description"` — it removes the line from `TODO.md` and appends it to `CHANGELOG.md` under today's date.
3. **Docs first:** When you change a folder's scope, update its `context.md`. When you make an architectural decision, add an ADR in `docs/decisions/`.
4. **Format on commit:** Husky pre-commit runs Prettier + ESLint via `lint-staged`. Do not bypass with `--no-verify`.
5. **CI green to merge:** Every PR must pass `.github/workflows/ci.yml` (lint + typecheck + test + build).
6. **Identical canon:** If you edit `CLAUDE.md`, copy the same change to `AGENTS.md` (and vice versa) in the same commit.

## 7. Tech stack
- Frontend: React 18 + Vite + TypeScript
- Backend: Python 3.12 + FastAPI + uvicorn
- Data: Parquet files via Polars (migrate to SQL/Postgres later)
- Infra: Local (macOS) — no remote deploy
- Package manager: `npm` (frontend) · `uv` (backend)
- Node version: 22
