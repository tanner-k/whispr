# 0003 — Parquet + Polars as the v1 data layer

**Status:** Accepted
**Date:** 2026-05-22

## Context
Whispr Studio needs to persist transcripts, history, vocabulary, and bench
results locally. We need to choose a v1 data layer. The realistic candidates
are SQLite (an embedded SQL database) and flat Parquet files read/written via
Polars.

## Decision
Use **Parquet files via Polars** as the v1 data layer, instead of SQLite.

## Rationale
- **Zero infra** — no database engine, no migrations, no connection management;
  just files on disk read and written with Polars.
- **Fast to build** — Polars gives a clean DataFrame API for the small, mostly
  append-and-scan access patterns Whispr needs.
- **Fine for local single-user scale** — Whispr is a local-first, single-user
  desktop app; data volumes are small and concurrency is trivial.
- **Migration path is open** — the data access is encapsulated behind a store
  layer, so moving to SQL/Postgres later is a contained change.

## Consequences
- (positive) No schema/migration machinery to maintain; trivial to inspect data
  with any Parquet-aware tool; minimal dependencies.
- (tradeoff) No transactions, no constraints, no relational queries — the store
  layer must enforce invariants in code. Concurrent writers are not supported
  (acceptable for single-user local use).
- (followup) When multi-user, server-side, or relational needs appear, write an
  ADR for the migration to SQL/Postgres (likely with an ORM or query builder).

## Alternatives considered
- **SQLite** — gives transactions, constraints, and SQL queries in a single
  embedded file. Rejected for v1 because it adds schema/migration overhead the
  current single-user, file-scale workload does not need; revisit on migration.
