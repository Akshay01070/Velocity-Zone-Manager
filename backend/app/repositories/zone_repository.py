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
