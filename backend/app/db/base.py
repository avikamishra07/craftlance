# This file re-exports Base from app.core.database — the single source of truth.
#
# Previously this file created a second Base using the legacy declarative_base()
# API. That Base was empty (no models registered) because all models inherit
# from app.core.database.Base, not from this one. Calling
# Base.metadata.create_all() with this Base created zero tables.
#
# All models already import Base from app.core.database directly.
# This file exists only for backwards compatibility if anything imports from it.

from app.core.database import Base

__all__ = ["Base"]
