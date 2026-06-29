"""
app/extensions.py

Extension singletons — initialized without an app object so that any
module can import them at parse time without triggering circular imports.
The actual app binding is done inside create_app() via .init_app().
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

# ── SQLAlchemy ORM ────────────────────────────────────────────────────────
db: SQLAlchemy = SQLAlchemy()

# ── Alembic migration manager ─────────────────────────────────────────────
migrate: Migrate = Migrate()

# ── JWT authentication manager ─────────────────────────────────────────────
jwt: JWTManager = JWTManager()
