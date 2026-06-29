"""
app/models/zone.py — Zone ORM model.

A Zone belongs to a Property and stores geographic geometry as JSONB.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import JSONB

from app.extensions import db


class ZoneType(str, enum.Enum):
    """Supported zone types."""

    FAIRWAY = "Fairway"
    ROUGH = "Rough"
    PERIMETER = "Perimeter"
    EXCLUSION = "Exclusion"


class ZoneStatus(str, enum.Enum):
    """Operational status of a zone."""

    ACTIVE = "Active"
    INACTIVE = "Inactive"


class Zone(db.Model):
    """Represents a geographic zone within a Property."""

    __tablename__ = "zones"

    id: db.Mapped[str] = db.mapped_column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    name: db.Mapped[str] = db.mapped_column(db.String(255), nullable=False)
    type: db.Mapped[ZoneType] = db.mapped_column(
        db.Enum(ZoneType, name="zone_type_enum"), nullable=False
    )
    status: db.Mapped[ZoneStatus] = db.mapped_column(
        db.Enum(ZoneStatus, name="zone_status_enum"),
        nullable=False,
        default=ZoneStatus.ACTIVE,
    )
    mower_count: db.Mapped[int] = db.mapped_column(
        db.Integer, nullable=False, default=0
    )

    # GeoJSON geometry stored as native JSONB (PostgreSQL)
    geometry: db.Mapped[dict] = db.mapped_column(JSONB, nullable=False)

    created_at: db.Mapped[datetime] = db.mapped_column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # ── Foreign key ────────────────────────────────────────────────────────
    property_id: db.Mapped[str] = db.mapped_column(
        db.String(36), db.ForeignKey("properties.id"), nullable=False, index=True
    )

    # ── Relationships ──────────────────────────────────────────────────────
    property: db.Mapped["Property"] = db.relationship(  # noqa: F821
        "Property", back_populates="zones"
    )

    def __repr__(self) -> str:
        return f"<Zone {self.name!r} ({self.type.value}, {self.status.value})>"
