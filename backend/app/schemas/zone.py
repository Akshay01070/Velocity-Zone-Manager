"""
app/schemas/zone.py — Marshmallow schemas for zone endpoints.

ZoneCreateSchema     — validates POST /properties/:id/zones body.
ZoneUpdateSchema     — validates PUT  /properties/:id/zones/:zone_id body.
GeoJSONImportSchema  — validates POST /properties/:id/zones/import body.
ZoneResponseSchema   — serialises a Zone ORM instance to JSON.

Geometry is stored as raw JSONB.  The import schema enforces that the
incoming document is a GeoJSON FeatureCollection whose features all carry
Polygon geometry.  Zone properties (name, type, status, mower_count) are
read from each feature's ``properties`` object with safe defaults.

Computed fields
---------------
understaffed  — True when area > mower_count * 2; never persisted to DB.
"""

from __future__ import annotations

from marshmallow import RAISE, Schema, ValidationError, fields, validate, validates, validates_schema

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


# ── GeoJSON import schema ─────────────────────────────────────────────────

# Allowed GeoJSON Polygon geometry types for zone import.
_POLYGON_TYPES = {"Polygon", "MultiPolygon"}


class GeoJSONImportSchema(Schema):
    """Validates a GeoJSON FeatureCollection for bulk zone import.

    Top-level rules
    ~~~~~~~~~~~~~~~
    * ``type`` must equal ``"FeatureCollection"``.
    * ``features`` must be a non-empty list.

    Per-feature rules (collected with ``featureIndex`` in error output)
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    * ``geometry`` must be present and non-null.
    * ``geometry.type`` must be ``"Polygon"`` or ``"MultiPolygon"``.
    * ``geometry.coordinates`` must be a non-empty list.
    * ``properties.name`` is used as the zone name; defaults to
      ``"Unnamed Zone <N>"`` when absent.
    * ``properties.type`` must be a valid ZoneType value when supplied;
      defaults to ``"Fairway"``.
    * ``properties.status`` must be a valid ZoneStatus value when supplied;
      defaults to ``"Active"``.
    * ``properties.mower_count`` must be a positive integer when supplied;
      defaults to ``1`` (import always requires ≥ 1 mower).
    """

    class Meta:
        unknown = RAISE

    type = fields.String(required=True)
    features = fields.List(fields.Dict(), required=True)

    @validates("type")
    def validate_type(self, value: str) -> None:
        if value != "FeatureCollection":
            raise ValidationError(
                f"Expected a GeoJSON FeatureCollection, got '{value}'."
            )

    @validates("features")
    def validate_features_not_empty(self, value: list) -> None:
        if not value:
            raise ValidationError("features must contain at least one feature.")

    @validates_schema
    def validate_each_feature(self, data: dict, **_) -> None:
        """Validate geometry and properties for every feature.

        Errors are collected across all features before raising so the caller
        receives a complete picture of what needs to be fixed.
        """
        features = data.get("features", [])
        feature_errors: list[dict] = []

        for idx, feature in enumerate(features):
            errs: list[str] = []

            # ── Feature-level structure ────────────────────────────────────
            if not isinstance(feature, dict):
                feature_errors.append(
                    {"featureIndex": idx, "errors": ["Feature must be a JSON object."]}
                )
                continue

            # ── Geometry validation ────────────────────────────────────────
            geometry = feature.get("geometry")
            if geometry is None:
                errs.append("geometry is required and must not be null.")
            elif not isinstance(geometry, dict):
                errs.append("geometry must be a JSON object.")
            else:
                geo_type = geometry.get("type")
                if geo_type not in _POLYGON_TYPES:
                    errs.append(
                        f"geometry.type must be 'Polygon' or 'MultiPolygon'; "
                        f"got '{geo_type}'."
                    )
                coords = geometry.get("coordinates")
                if not coords:
                    errs.append("geometry.coordinates must be a non-empty list.")

            # ── Properties validation ──────────────────────────────────────
            props = feature.get("properties") or {}
            if not isinstance(props, dict):
                errs.append("properties must be a JSON object or null.")
            else:
                zone_type = props.get("type")
                if zone_type is not None and zone_type not in _VALID_TYPES:
                    errs.append(
                        f"properties.type '{zone_type}' is invalid. "
                        f"Must be one of: {_VALID_TYPES}."
                    )

                zone_status = props.get("status")
                if zone_status is not None and zone_status not in _VALID_STATUSES:
                    errs.append(
                        f"properties.status '{zone_status}' is invalid. "
                        f"Must be one of: {_VALID_STATUSES}."
                    )

                mower_count = props.get("mower_count")
                if mower_count is not None:
                    if not isinstance(mower_count, int) or isinstance(mower_count, bool):
                        errs.append("properties.mower_count must be an integer.")
                    elif mower_count < 1:
                        errs.append(
                            "properties.mower_count must be at least 1 "
                            "(a zone must have at least one assigned mower)."
                        )

            if errs:
                feature_errors.append({"featureIndex": idx, "errors": errs})

        if feature_errors:
            raise ValidationError({"features": feature_errors})


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
