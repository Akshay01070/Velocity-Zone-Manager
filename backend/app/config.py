"""
app/config.py — Configuration classes.

Three environments are provided:
  - DevelopmentConfig  (default)
  - TestingConfig
  - ProductionConfig

The active config is selected via the FLASK_ENV environment variable
(or the config_name argument to create_app).
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class BaseConfig:
    """Shared configuration values across all environments."""

    # Flask
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fallback-secret-key")

    # SQLAlchemy
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False
    SQLALCHEMY_DATABASE_URI: str = os.getenv(
        "DATABASE_URL",
        "postgresql://vzm_user:vzm_secret@localhost:5432/vzm_db",
    )

    # JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "fallback-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES: timedelta = timedelta(
        seconds=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES", 900))
    )
    JWT_REFRESH_TOKEN_EXPIRES: timedelta = timedelta(
        seconds=int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES", 2592000))
    )
    JWT_TOKEN_LOCATION: list[str] = ["headers"]
    JWT_HEADER_NAME: str = "Authorization"
    JWT_HEADER_TYPE: str = "Bearer"


class DevelopmentConfig(BaseConfig):
    """Development-specific overrides."""

    DEBUG: bool = True
    SQLALCHEMY_ECHO: bool = True  # Log all SQL statements


class TestingConfig(BaseConfig):
    """Testing-specific overrides (uses an in-memory SQLite database)."""

    TESTING: bool = True
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///:memory:"
    JWT_ACCESS_TOKEN_EXPIRES: timedelta = timedelta(minutes=5)


class ProductionConfig(BaseConfig):
    """Production-specific overrides."""

    DEBUG: bool = False
    SQLALCHEMY_ECHO: bool = False


# ── Lookup table used by the application factory ───────────────────────────
config_by_name: dict[str, type[BaseConfig]] = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
