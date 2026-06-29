"""
app/extensions.py — Extension singletons.

Instantiated here (without an app object) so that blueprints and
models can import them without triggering circular imports.
The actual app binding happens in create_app() via init_app().
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

db: SQLAlchemy = SQLAlchemy()
migrate: Migrate = Migrate()
jwt: JWTManager = JWTManager()
