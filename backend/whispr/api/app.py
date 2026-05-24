"""FastAPI app factory for Whispr Studio."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from whispr.api import (
    routes_bench,
    routes_capture,
    routes_health,
    routes_history,
    routes_settings,
    routes_stt,
    routes_vocab,
)
from whispr.config import AppSettings
from whispr.config import settings as default_settings
from whispr.llm.markdown import create_markdown_sectioner
from whispr.models import fail
from whispr.store import ParquetStore, StoreError
from whispr.stt import create_stt_engine


def create_app(settings: AppSettings = default_settings) -> FastAPI:
    """Create the FastAPI application and seed local data on first run."""
    store = ParquetStore(settings)

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        store.seed_if_needed()
        yield

    app = FastAPI(title="Whispr Studio API", lifespan=lifespan)
    app.state.store = store
    app.state.stt_engine = create_stt_engine(
        settings.stt_model,
        whisper_cpp_bin=settings.whisper_cpp_bin,
        device=settings.device,
    )
    app.state.markdown_sectioner = create_markdown_sectioner(
        settings.llm_model,
        device=settings.device,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(routes_health.router)
    app.include_router(routes_stt.router)
    app.include_router(routes_capture.router)
    app.include_router(routes_history.router)
    app.include_router(routes_bench.router)
    app.include_router(routes_vocab.router)
    app.include_router(routes_settings.router)

    @app.exception_handler(StoreError)
    async def store_error_handler(_request: Request, exc: StoreError) -> JSONResponse:
        return JSONResponse(status_code=400, content=fail(str(exc)).model_dump())

    @app.exception_handler(HTTPException)
    async def http_error_handler(_request: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=fail(str(exc.detail)).model_dump())

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(status_code=422, content=fail(str(exc)).model_dump())

    _mount_spa(app, settings.frontend_dist)
    return app


def _mount_spa(app: FastAPI, frontend_dist: Path) -> None:
    if frontend_dist.exists():
        app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="spa")


app = create_app()
