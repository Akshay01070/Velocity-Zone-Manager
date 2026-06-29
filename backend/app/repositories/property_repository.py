"""
app/repositories/property_repository.py — Data-access helpers for Property.

All raw SQLAlchemy queries live here so that the service layer stays
free of query-building logic. Repository functions receive primitive
arguments and return ORM objects (or None / lists).

No HTTP objects (request, jsonify) appear here — this layer is
framework-agnostic and independently testable.
"""

from __future__ import annotations

from app.extensions import db
from app.models.property import Property, PropertyType


# ── Read helpers ───────────────────────────────────────────────────────────

def get_property_by_id(property_id: str, user_id: str) -> Property | None:
    """Return a Property owned by *user_id* with *property_id*, or None."""
    return db.session.execute(
        db.select(Property).where(
            Property.id == property_id,
            Property.user_id == user_id,
        )
    ).scalar_one_or_none()


def list_properties(
    user_id: str,
    *,
    search: str | None = None,
    type_filter: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Property], int]:
    """Return a paginated list of properties and the total count.

    Args:
        user_id:     Filter to this user's properties only.
        search:      Case-insensitive substring match on ``name``.
        type_filter: Exact match on ``PropertyType`` value string.
        page:        1-indexed page number.
        limit:       Number of records per page (max enforced by caller).

    Returns:
        A tuple of ``(records, total_count)``.
    """
    query = db.select(Property).where(Property.user_id == user_id)

    if search:
        query = query.where(Property.name.ilike(f"%{search.strip()}%"))

    if type_filter:
        enum_value = PropertyType(type_filter)  # validated upstream
        query = query.where(Property.type == enum_value)

    # Total count (before pagination)
    count_query = db.select(db.func.count()).select_from(query.subquery())
    total: int = db.session.execute(count_query).scalar_one()

    # Paginated records
    offset = (page - 1) * limit
    records = db.session.execute(
        query.order_by(Property.name).offset(offset).limit(limit)
    ).scalars().all()

    return list(records), total


# ── Write helpers ──────────────────────────────────────────────────────────

def create_property(
    *,
    user_id: str,
    name: str,
    property_type: PropertyType,
    total_acreage: float | None,
    notes: str | None,
) -> Property:
    """Persist a new Property and return it."""
    prop = Property(
        user_id=user_id,
        name=name,
        type=property_type,
        total_acreage=total_acreage,
        notes=notes,
    )
    db.session.add(prop)
    db.session.commit()
    db.session.refresh(prop)
    return prop


def update_property(prop: Property, updates: dict) -> Property:
    """Apply *updates* dict to *prop* and persist changes.

    Only keys present in *updates* are touched. Caller must have
    already validated the values.
    """
    if "name" in updates:
        prop.name = updates["name"].strip()
    if "type" in updates:
        prop.type = PropertyType(updates["type"])
    if "total_acreage" in updates:
        prop.total_acreage = updates["total_acreage"]
    if "notes" in updates:
        prop.notes = updates["notes"]

    db.session.commit()
    db.session.refresh(prop)
    return prop


def delete_property(prop: Property) -> None:
    """Hard-delete *prop* and its cascaded zones."""
    db.session.delete(prop)
    db.session.commit()
