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
- One route file per resource (e.g. `whispr/api/routes_history.py`)
- Validation at the edge (request → Pydantic model) — never trust the client
- Errors surface as typed problem objects / the standard API envelope; do not raise raw strings
- All config/env access through a single `whispr/config.py` — fail loudly if a required value is missing
