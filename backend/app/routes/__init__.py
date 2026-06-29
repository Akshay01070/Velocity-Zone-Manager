"""app/routes/__init__.py — Route (Blueprint) registry.

All blueprints are imported and registered here.
create_app() calls register_routes(app) to attach them.
"""

from flask import Flask

API_V1 = "/api/v1"


def register_routes(app: Flask) -> None:
    """Attach all application blueprints to *app*.

    Import blueprints inside the function body to avoid circular
    imports — the blueprint modules may themselves import from
    app.services or app.schemas which import app.extensions.
    """
    from app.routes.health import health_bp
    from app.routes.auth import auth_bp
    from app.routes.properties import properties_bp

    # ── System routes ──────────────────────────────────────────────────────
    app.register_blueprint(health_bp)

    # ── Auth routes (public) ───────────────────────────────────────────────
    app.register_blueprint(auth_bp, url_prefix=f"{API_V1}/auth")

    # ── Properties routes (JWT-protected) ─────────────────────────────────
    app.register_blueprint(properties_bp, url_prefix=f"{API_V1}/properties")
