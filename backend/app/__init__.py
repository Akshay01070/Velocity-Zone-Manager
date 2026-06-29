"""
app/__init__.py — Application Factory.

Only this module should construct the Flask app object.
Everything else (models, routes, services) imports from here
indirectly via extensions.py to prevent circular imports.

Initialization order (matters!):
  1. Create Flask app
  2. Load configuration
  3. Initialize extensions  (db, migrate, jwt)
  4. Register middleware     (CORS, error handlers, request logger)
  5. Register routes         (blueprints)

Usage:
  from app import create_app
  app = create_app()          # defaults to FLASK_ENV or "development"
  app = create_app("testing") # override for test suites
"""

from __future__ import annotations

import logging
import os

from flask import Flask
from flask_cors import CORS

from app.config import config_by_name
from app.extensions import db, migrate, jwt


def create_app(config_name: str | None = None) -> Flask:
    """Construct and return a fully configured Flask application.

    Args:
        config_name: One of ``'development'``, ``'testing'``, or
                     ``'production'``.  Falls back to the
                     ``FLASK_ENV`` environment variable, then
                     ``'development'``.

    Returns:
        Configured :class:`flask.Flask` instance.
    """
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)

    # ── 1. Configuration ───────────────────────────────────────────────────
    _load_config(app, config_name)

    # ── 2. Extensions ──────────────────────────────────────────────────────
    _init_extensions(app)

    # ── 3. Middleware ──────────────────────────────────────────────────────
    _register_middleware(app)

    # ── 4. Routes ──────────────────────────────────────────────────────────
    _register_routes(app)

    app.logger.info("Velocity Zone Manager started [env=%s]", config_name)
    return app


# ── Private helpers ────────────────────────────────────────────────────────

def _load_config(app: Flask, config_name: str) -> None:
    """Apply the named configuration class to *app*."""
    cfg = config_by_name.get(config_name)
    if cfg is None:
        raise ValueError(
            f"Unknown config_name '{config_name}'. "
            f"Valid options: {list(config_by_name.keys())}"
        )
    app.config.from_object(cfg)

    # Configure root logger level from Flask debug flag
    log_level = logging.DEBUG if app.config.get("DEBUG") else logging.INFO
    logging.basicConfig(level=log_level)


def _init_extensions(app: Flask) -> None:
    """Bind all extensions to *app* via their init_app() hooks.

    SQLAlchemy  — ORM and connection pool
    Migrate     — Alembic migration support
    JWTManager  — JWT encode / decode / revocation hooks
    CORS        — Cross-Origin Resource Sharing headers
    """
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "*")}},
        supports_credentials=True,
    )


def _register_middleware(app: Flask) -> None:
    """Attach before/after-request hooks and error handlers."""
    from app.middleware.error_handlers import register_error_handlers
    from app.middleware.request_logger import register_request_logger

    register_error_handlers(app)
    register_request_logger(app)


def _register_routes(app: Flask) -> None:
    """Mount all blueprints via the routes registry."""
    from app.routes import register_routes

    register_routes(app)
