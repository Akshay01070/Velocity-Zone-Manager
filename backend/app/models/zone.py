"""
app/models/zone.py — VelocityZone ORM model.

Stores geographic zone data. Geometry is stored as GeoJSON string
in a Text column for portability (PostGIS extension not required).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.extensions import db


class Zone(db.Model):
    """Represents a velocity zone on the map."""

    __tablename__ = "zones"

    id: db.Mapped[str] = db.mapped_column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    name: db.Mapped[str] = db.mapped_column(db.String(255), nullable=False)
    description: db.Mapped[str | None] = db.mapped_column(db.Text, nullable=True)

    # GeoJSON geometry string (e.g. Polygon / MultiPolygon)
    geometry: db.Mapped[str] = db.mapped_column(db.Text, nullable=False)

    # Speed limit in km/h
    speed_limit_kmh: db.Mapped[float] = db.mapped_column(db.Float, nullable=False)

    is_active: db.Mapped[bool] = db.mapped_column(db.Boolean, default=True)

    owner_id: db.Mapped[str] = db.mapped_column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )

    created_at: db.Mapped[datetime] = db.mapped_column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: db.Mapped[datetime] = db.mapped_column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    owner: db.Mapped["User"] = db.relationship("User", back_populates="zones")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Zone {self.name} ({self.speed_limit_kmh} km/h)>"
