"""
app/models/property.py — Property ORM model.

A Property belongs to a User and contains one or more Zones.
"""

from __future__ import annotations

import enum
import uuid

from app.extensions import db


class PropertyType(str, enum.Enum):
    """Supported property types."""

    GOLF_COURSE = "Golf Course"
    AIRPORT = "Airport"
    CORPORATE_CAMPUS = "Corporate Campus"
    OTHER = "Other"


class Property(db.Model):
    """Represents a physical property managed by a user."""

    __tablename__ = "properties"

    id: db.Mapped[str] = db.mapped_column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    name: db.Mapped[str] = db.mapped_column(db.String(255), nullable=False)
    type: db.Mapped[PropertyType] = db.mapped_column(
        db.Enum(PropertyType, name="property_type_enum"), nullable=False
    )
    total_acreage: db.Mapped[float | None] = db.mapped_column(
        db.Float, nullable=True
    )
    notes: db.Mapped[str | None] = db.mapped_column(db.Text, nullable=True)

    # ── Foreign key ────────────────────────────────────────────────────────
    user_id: db.Mapped[str] = db.mapped_column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )

    # ── Relationships ──────────────────────────────────────────────────────
    owner: db.Mapped["User"] = db.relationship(  # noqa: F821
        "User", back_populates="properties"
    )
    zones: db.Mapped[list["Zone"]] = db.relationship(  # noqa: F821
        "Zone", back_populates="property", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Property {self.name!r} ({self.type.value})>"
