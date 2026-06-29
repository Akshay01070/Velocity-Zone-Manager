"""app/models/__init__.py — ORM model registry.

Import every model here so that Flask-Migrate can discover them
during `flask db migrate`.  No circular-import risk because models
only import `db` from app.extensions, never from app itself.
"""

from app.models.user import User
from app.models.property import Property, PropertyType
from app.models.zone import Zone, ZoneType, ZoneStatus

__all__: list[str] = [
    "User",
    "Property",
    "PropertyType",
    "Zone",
    "ZoneType",
    "ZoneStatus",
]
