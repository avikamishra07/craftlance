# This file re-exports from app.core.database — the single source of truth
# for the SQLAlchemy engine and session.
#
# Previously this file hardcoded DATABASE_URL directly, which ignored .env
# and created a second rogue engine with no connection pooling.
# All DB setup now lives in app/core/database.py which reads settings.DATABASE_URL.

from app.core.database import engine, SessionLocal, get_db

__all__ = ["engine", "SessionLocal", "get_db"]
