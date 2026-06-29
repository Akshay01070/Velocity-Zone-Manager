"""
app/config.py

Configuration hierarchy:
  BaseConfig          — shared defaults read from environment / .env
  DevelopmentConfig   — DEBUG on, SQL echo on
  TestingConfig       — in-memory SQLite, short token lifetimes
  ProductionConfig    — DEBUG off, strict settings

Selected via FLASK_ENV environment variable or the config_name arg
passed to create_app().
"""

from __future__ import annotations

import os
from datetime import timedelta

from dotenv import load_dotenv

# Load .env file if present (no-op when running inside Docker)
load_dotenv()


class BaseConfig:
    """Values shared across all environments."""

    # ── Flask ──────────────────────────────────────────────────────────────
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
    JSON_SORT_KEYS: bool = False

    # ── SQLAlchemy ─────────────────────────────────────────────────────────
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_DATABASE_URI: str = os.getenv(
        "DATABASE_URL",
        "postgresql://vzm_user:vzm_secret@localhost:5432/vzm_db",
    )

    # ── JWT ────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
    JWT_TOKEN_LOCATION: list[str] = ["headers"]
    JWT_HEADER_NAME: str = "Authorization"
    JWT_HEADER_TYPE: str = "Bearer"
    JWT_ACCESS_TOKEN_EXPIRES: timedelta = timedelta(
        seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", "900"))
    )
    JWT_REFRESH_TOKEN_EXPIRES: timedelta = timedelta(
        seconds=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", "2592000"))
    )


class DevelopmentConfig(BaseConfig):
    """Local development — verbose SQL logging enabled."""

    DEBUG: bool = True
    SQLALCHEMY_ECHO: bool = True


class TestingConfig(BaseConfig):
    """Automated tests — in-memory database, short-lived tokens."""

    TESTING: bool = True
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///:memory:"
    SQLALCHEMY_ECHO: bool = False
    JWT_ACCESS_TOKEN_EXPIRES: timedelta = timedelta(minutes=5)
    JWT_REFRESH_TOKEN_EXPIRES: timedelta = timedelta(minutes=10)


class ProductionConfig(BaseConfig):
    """Production — debug off, no SQL echo."""

    DEBUG: bool = False
    SQLALCHEMY_ECHO: bool = False


# ── Registry consumed by create_app() ─────────────────────────────────────
config_by_name: dict[str, type[BaseConfig]] = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
