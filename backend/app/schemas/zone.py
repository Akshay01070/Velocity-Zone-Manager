"""
app/schemas/zone.py — Marshmallow schemas for zone endpoints.

ZoneCreateSchema   — validates POST /properties/:id/zones body.
ZoneUpdateSchema   — validates PUT  /properties/:id/zones/:zone_id body.
ZoneResponseSchema — serialises a Zone ORM instance to JSON.

Geometry is accepted and returned as a raw dict (JSONB).
Full GeoJSON validation is intentionally deferred to a future task.

Computed fields
---------------
understaffed  — True when area > mower_count * 2; never persisted to DB.
"""

from __future__ import annotations

from marshmallow import RAISE, Schema, ValidationError, fields, validate, validates

from app.models.zone import ZoneStatus, ZoneType

# ── Enum value lists ───────────────────────────────────────────────────────

_VALID_TYPES = [t.value for t in ZoneType]
_VALID_STATUSES = [s.value for s in ZoneStatus]


def _validate_zone_type(value: str) -> None:
    if value not in _VALID_TYPES:
        raise ValidationError(
            f"Invalid zone type '{value}'. Must be one of: {_VALID_TYPES}."
        )


def _validate_zone_status(value: str) -> None:
    if value not in _VALID_STATUSES:
        raise ValidationError(
            f"Invalid zone status '{value}'. Must be one of: {_VALID_STATUSES}."
        )


# ── Request schemas ────────────────────────────────────────────────────────

class ZoneCreateSchema(Schema):
    """Validates the request body for creating a zone."""

    class Meta:
        unknown = RAISE

    name = fields.String(
        required=True,
        validate=validate.Length(min=1, max=255, error="name must be 1–255 characters."),
    )
    type = fields.String(required=True)
    status = fields.String(required=False, load_default=ZoneStatus.ACTIVE.value)
    mower_count = fields.Integer(required=False, load_default=0)
    geometry = fields.Dict(required=True)

    @validates("name")
    def validate_name(self, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValidationError("name must not be blank.")
        return stripped

    @validates("type")
    def validate_type(self, value: str) -> None:
        _validate_zone_type(value)

    @validates("status")
    def validate_status(self, value: str) -> None:
        _validate_zone_status(value)

    @validates("mower_count")
    def validate_mower_count(self, value: int) -> None:
        if value < 0:
            raise ValidationError("mower_count must be a non-negative integer.")

    @validates("geometry")
    def validate_geometry(self, value: dict) -> None:
        if not value:
            raise ValidationError("geometry must not be an empty object.")


class ZoneUpdateSchema(Schema):
    """Validates the request body for updating a zone.

    All fields are optional — only supplied fields are updated.
    """

    class Meta:
        unknown = RAISE

    name = fields.String(
        required=False,
        validate=validate.Length(min=1, max=255, error="name must be 1–255 characters."),
    )
    type = fields.String(required=False)
    status = fields.String(required=False)
    mower_count = fields.Integer(required=False)
    geometry = fields.Dict(required=False)

    @validates("name")
    def validate_name(self, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValidationError("name must not be blank.")
        return stripped

    @validates("type")
    def validate_type(self, value: str) -> None:
        _validate_zone_type(value)

    @validates("status")
    def validate_status(self, value: str) -> None:
        _validate_zone_status(value)

    @validates("mower_count")
    def validate_mower_count(self, value: int) -> None:
        if value < 0:
            raise ValidationError("mower_count must be a non-negative integer.")

    @validates("geometry")
    def validate_geometry(self, value: dict) -> None:
        if not value:
            raise ValidationError("geometry must not be an empty object.")


# ── Response schema ────────────────────────────────────────────────────────

class ZoneResponseSchema(Schema):
    """Serialises a Zone ORM instance to a dict for JSON responses.

    ``understaffed`` is a computed field (area > mower_count * 2) and is
    **never** stored in the database.
    """

    id = fields.String()
    property_id = fields.String()
    name = fields.String()
    type = fields.Method("get_type")
    status = fields.Method("get_status")
    mower_count = fields.Integer()
    geometry = fields.Dict()
    created_at = fields.Method("get_created_at")
    understaffed = fields.Method("get_understaffed")

    def get_type(self, obj) -> str | None:
        return obj.type.value if obj.type else None

    def get_status(self, obj) -> str | None:
        return obj.status.value if obj.status else None

    def get_created_at(self, obj) -> str | None:
        return obj.created_at.isoformat() if obj.created_at else None

    def get_understaffed(self, obj) -> bool:
        """Compute understaffed flag: area > mower_count * 2.

        ``area`` is read from ``geometry["area"]`` (numeric). If the key is
        absent the zone is not considered understaffed.
        """
        area = float(obj.geometry.get("area", 0)) if obj.geometry else 0.0
        return area > obj.mower_count * 2


_zone_schema = ZoneResponseSchema()
_zones_schema = ZoneResponseSchema(many=True)


def dump_zone(zone) -> dict:
    """Serialise a single Zone instance."""
    return _zone_schema.dump(zone)


def dump_zones(zones: list) -> list[dict]:
    """Serialise a list of Zone instances."""
    return _zones_schema.dump(zones)
