"""
app/__init__.py — Application factory.

Creates and configures the Flask application instance.
All extensions and blueprints are registered here so that
the app object never lives at module import time (avoids
circular-import issues).
"""

from flask import Flask
from flask_cors import CORS

from app.extensions import db, migrate, jwt
from app.config import config_by_name


def create_app(config_name: str = "development") -> Flask:
    """Factory function that creates the Flask application.

    Args:
        config_name: One of 'development', 'testing', or 'production'.
                     Defaults to 'development'.

    Returns:
        Configured Flask application instance.
    """
    app = Flask(__name__)

    # ── Load configuration ─────────────────────────────────────────────
    app.config.from_object(config_by_name[config_name])

    # ── Initialize extensions ──────────────────────────────────────────
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # ── Register blueprints ────────────────────────────────────────────
    from app.blueprints.auth.routes import auth_bp
    from app.blueprints.zones.routes import zones_bp

    API_PREFIX = "/api/v1"
    app.register_blueprint(auth_bp, url_prefix=f"{API_PREFIX}/auth")
    app.register_blueprint(zones_bp, url_prefix=f"{API_PREFIX}/zones")

    # ── Health-check route ─────────────────────────────────────────────
    @app.get("/health")
    def health():
        return {"status": "ok", "service": "velocity-zone-manager"}, 200

    return app
