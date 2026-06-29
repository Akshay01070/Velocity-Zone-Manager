"""
app/models/user.py — User ORM model.

Stores authentication credentials.
Password hashing will be implemented in the auth service layer.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.extensions import db


class User(db.Model):
    """Represents an authenticated user of the system."""

    __tablename__ = "users"

    id: db.Mapped[str] = db.mapped_column(
        db.String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    email: db.Mapped[str] = db.mapped_column(
        db.String(255), unique=True, nullable=False, index=True
    )
    password_hash: db.Mapped[str] = db.mapped_column(db.String(255), nullable=False)
    full_name: db.Mapped[str] = db.mapped_column(db.String(255), nullable=False)
    is_active: db.Mapped[bool] = db.mapped_column(db.Boolean, default=True)

    created_at: db.Mapped[datetime] = db.mapped_column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: db.Mapped[datetime] = db.mapped_column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    zones: db.Mapped[list["Zone"]] = db.relationship(  # noqa: F821
        "Zone", back_populates="owner", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"
