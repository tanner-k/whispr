# backend/

## Scope
- HTTP/API endpoints
- Business logic & domain models
- Authentication / authorization
- Background jobs, schedulers, queue workers

## Not in scope
- UI rendering → `frontend/`
- Database schema → `data/`
- Cloud infrastructure → `infra/`

## Stack
Python 3.12 + FastAPI + uvicorn

## Local skills / conventions
- None yet — add as needed

## Run
```bash
# from repo root (package root is backend/, configured in pyproject.toml)
uv run python -m whispr
```

## Notes for agents
- One route file per resource (e.g. `routes/users.ts`)
- Validation at the edge (request → typed input) — never trust the client
- Errors surface as typed problem objects; do not throw raw strings
- All env access through a single `config.ts` — fail loudly if a required env var is missing
