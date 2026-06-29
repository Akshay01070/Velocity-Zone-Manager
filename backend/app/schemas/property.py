"""
app/schemas/property.py — Marshmallow schemas for the properties endpoints.

PropertyCreateSchema  — validates POST /properties body.
PropertyUpdateSchema  — validates PUT  /properties/:id body (all fields optional).
PropertyResponseSchema — serialises a Property ORM object to JSON.
PropertyListQuerySchema — validates query-string params for GET /properties.
"""

from __future__ import annotations

from marshmallow import RAISE, Schema, ValidationError, fields, validates, validate

from app.models.property import PropertyType


# ── Helpers ────────────────────────────────────────────────────────────────

_VALID_TYPES = [t.value for t in PropertyType]


def _validate_type(value: str) -> None:
    if value not in _VALID_TYPES:
        raise ValidationError(
            f"Invalid property type '{value}'. "
            f"Must be one of: {_VALID_TYPES}."
        )


# ── Request schemas ────────────────────────────────────────────────────────

class PropertyCreateSchema(Schema):
    """Validates the request body for creating a property."""

    class Meta:
        unknown = RAISE

    name = fields.String(
        required=True,
        validate=validate.Length(min=1, max=255, error="name must be 1–255 characters."),
    )
    type = fields.String(required=True)
    total_acreage = fields.Float(required=False, load_default=None, allow_none=True)
    notes = fields.String(required=False, load_default=None, allow_none=True)

    @validates("name")
    def validate_name(self, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValidationError("name must not be blank.")
        return stripped

    @validates("type")
    def validate_type(self, value: str) -> None:
        _validate_type(value)

    @validates("total_acreage")
    def validate_acreage(self, value: float | None) -> None:
        if value is not None and value < 0:
            raise ValidationError("total_acreage must be a non-negative number.")


class PropertyUpdateSchema(Schema):
    """Validates the request body for updating a property.

    All fields are optional — only supplied fields are updated.
    """

    class Meta:
        unknown = RAISE

    name = fields.String(
        required=False,
        validate=validate.Length(min=1, max=255, error="name must be 1–255 characters."),
    )
    type = fields.String(required=False)
    total_acreage = fields.Float(required=False, allow_none=True)
    notes = fields.String(required=False, allow_none=True)

    @validates("name")
    def validate_name(self, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValidationError("name must not be blank.")
        return stripped

    @validates("type")
    def validate_type(self, value: str) -> None:
        _validate_type(value)

    @validates("total_acreage")
    def validate_acreage(self, value: float | None) -> None:
        if value is not None and value < 0:
            raise ValidationError("total_acreage must be a non-negative number.")


# ── Query-string schema ────────────────────────────────────────────────────

class PropertyListQuerySchema(Schema):
    """Validates query-string parameters for GET /properties.

    Supported params:
        search (str)  — partial, case-insensitive match against name.
        type   (str)  — exact match against PropertyType value.
        page   (int)  — 1-indexed page number (default 1).
        limit  (int)  — page size, max 100 (default 20).
    """

    class Meta:
        unknown = RAISE

    search = fields.String(required=False, load_default=None)
    type = fields.String(required=False, load_default=None)
    page = fields.Integer(
        required=False,
        load_default=1,
        validate=validate.Range(min=1, error="page must be ≥ 1."),
    )
    limit = fields.Integer(
        required=False,
        load_default=20,
        validate=validate.Range(min=1, max=100, error="limit must be between 1 and 100."),
    )

    @validates("type")
    def validate_type(self, value: str | None) -> None:
        if value is not None:
            _validate_type(value)


# ── Response schema ────────────────────────────────────────────────────────

class PropertyResponseSchema(Schema):
    """Serialises a Property ORM instance to a dict for JSON responses."""

    id = fields.String()
    name = fields.String()
    type = fields.Method("get_type")
    total_acreage = fields.Float(allow_none=True)
    notes = fields.String(allow_none=True)
    user_id = fields.String()
    zone_count = fields.Method("get_zone_count")

    def get_type(self, obj) -> str:
        """Return the enum's human-readable value string."""
        return obj.type.value if obj.type else None

    def get_zone_count(self, obj) -> int:
        """Return the number of zones without triggering a lazy-load."""
        # zones relationship is loaded by the service when needed;
        # fall back to 0 if not loaded to avoid N+1.
        try:
            return len(obj.zones)
        except Exception:
            return 0


_property_schema = PropertyResponseSchema()
_properties_schema = PropertyResponseSchema(many=True)


def dump_property(prop) -> dict:
    """Serialise a single Property instance."""
    return _property_schema.dump(prop)


def dump_properties(props: list) -> list[dict]:
    """Serialise a list of Property instances."""
    return _properties_schema.dump(props)
