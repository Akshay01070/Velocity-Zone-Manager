"""
app/repositories/zone_repository.py — Data-access helpers for Zone.

All raw SQLAlchemy queries live here. The service layer stays free of
query-building logic. Functions receive primitives and return ORM objects.

No HTTP objects appear here — this layer is framework-agnostic.
"""

from __future__ import annotations

from app.extensions import db
from app.models.zone import Zone, ZoneStatus, ZoneType


# ── Read helpers ───────────────────────────────────────────────────────────

def get_zone_by_id(zone_id: str, property_id: str) -> Zone | None:
    """Return a Zone belonging to *property_id* with *zone_id*, or None."""
    return db.session.execute(
        db.select(Zone).where(
            Zone.id == zone_id,
            Zone.property_id == property_id,
        )
    ).scalar_one_or_none()


def list_zones_for_property(property_id: str) -> list[Zone]:
    """Return all zones for *property_id*, ordered by name."""
    return (
        db.session.execute(
            db.select(Zone)
            .where(Zone.property_id == property_id)
            .order_by(Zone.name)
        )
        .scalars()
        .all()
    )


# ── Write helpers ──────────────────────────────────────────────────────────

def create_zone(
    *,
    property_id: str,
    name: str,
    zone_type: ZoneType,
    status: ZoneStatus,
    mower_count: int,
    geometry: dict,
) -> Zone:
    """Persist a new Zone and return it."""
    zone = Zone(
        property_id=property_id,
        name=name,
        type=zone_type,
        status=status,
        mower_count=mower_count,
        geometry=geometry,
    )
    db.session.add(zone)
    db.session.commit()
    db.session.refresh(zone)
    return zone


def update_zone(zone: Zone, updates: dict) -> Zone:
    """Apply *updates* dict to *zone* and persist changes.

    Only keys present in *updates* are touched. Caller must have
    already validated the values.
    """
    if "name" in updates:
        zone.name = updates["name"].strip()
    if "type" in updates:
        zone.type = ZoneType(updates["type"])
    if "status" in updates:
        zone.status = ZoneStatus(updates["status"])
    if "mower_count" in updates:
        zone.mower_count = updates["mower_count"]
    if "geometry" in updates:
        zone.geometry = updates["geometry"]

    db.session.commit()
    db.session.refresh(zone)
    return zone


def delete_zone(zone: Zone) -> None:
    """Hard-delete *zone*."""
    db.session.delete(zone)
    db.session.commit()


def bulk_create_zones(zone_rows: list[dict]) -> list[Zone]:
    """Persist multiple zones in a single atomic transaction.

    Args:
        zone_rows: List of dicts, each with keys:
            property_id, name, zone_type (ZoneType), status (ZoneStatus),
            mower_count, geometry.

    Returns:
        List of created :class:`Zone` instances in insertion order.

    Raises:
        SQLAlchemyError: propagated on DB failure; caller handles rollback
            by keeping the session in its default auto-rollback-on-error
            state (Flask-SQLAlchemy rolls back on uncaught exceptions).
    """
    zones: list[Zone] = [
        Zone(
            property_id=row["property_id"],
            name=row["name"],
            type=row["zone_type"],
            status=row["status"],
            mower_count=row["mower_count"],
            geometry=row["geometry"],
        )
        for row in zone_rows
    ]

    db.session.add_all(zones)
    db.session.commit()

    for zone in zones:
        db.session.refresh(zone)

    return zones
