"""
app/routes/zones.py — Zones CRUD blueprint (JWT-protected, nested under properties).

All routes sit under the /api/v1/properties/<property_id>/zones prefix
and require a valid Bearer token. The service layer enforces that the
parent property is owned by the authenticated user before any zone
operation is performed.

Routes
------
GET    /api/v1/properties/<property_id>/zones                  List all zones.
GET    /api/v1/properties/<property_id>/zones/summary          Zone summary stats.
POST   /api/v1/properties/<property_id>/zones                  Create a zone.
POST   /api/v1/properties/<property_id>/zones/import           Bulk GeoJSON import.
PUT    /api/v1/properties/<property_id>/zones/<zone_id>        Update a zone.
DELETE /api/v1/properties/<property_id>/zones/<zone_id>        Delete a zone.

Success envelope:
    { "data": { ... } }

Error envelope:
    { "error": { "code": N, "status": "...", "message": "..." } }
"""

from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from app.schemas.zone import (
    GeoJSONImportSchema,
    ZoneCreateSchema,
    ZoneUpdateSchema,
    dump_zone,
    dump_zones,
)
from app.services.zone_service import ZoneError, ZoneService

zones_bp = Blueprint("zones", __name__)

# Schema singletons — instantiated once at module load.
_create_schema = ZoneCreateSchema()
_update_schema = ZoneUpdateSchema()
_import_schema = GeoJSONImportSchema()


# ── Response helpers ───────────────────────────────────────────────────────

def _ok(data, code: int = 200):
    return jsonify({"data": data}), code


def _error(code: int, status: str, message):
    return jsonify({"error": {"code": code, "status": status, "message": message}}), code


_STATUS_NAMES: dict[int, str] = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    422: "Unprocessable Entity",
    500: "Internal Server Error",
}


def _status_name(code: int) -> str:
    return _STATUS_NAMES.get(code, "Error")


def _service_error(exc: ZoneError):
    return _error(exc.http_status, _status_name(exc.http_status), exc.message)


# ── Endpoints ──────────────────────────────────────────────────────────────

@zones_bp.get("/")
@jwt_required()
def list_zones(property_id: str):
    """List all zones for a property.

    The property must belong to the authenticated user.

    Returns:
        200 OK  — list of zone objects (may be empty).
        404     — property not found or not owned by user.
    """
    user_id: str = get_jwt_identity()

    try:
        zones = ZoneService.list_zones(property_id, user_id)
    except ZoneError as exc:
        return _service_error(exc)

    return _ok({"property_id": property_id, "zones": dump_zones(zones)})


@zones_bp.post("/")
@jwt_required()
def create_zone(property_id: str):
    """Create a new zone inside a property.

    Request body (JSON):
        name        (str, required)
        type        (str, required)  — Fairway | Rough | Perimeter | Exclusion
        status      (str, optional)  — Active | Inactive  (default: Active)
        mower_count (int, optional)  — ≥ 0                (default: 0)
        geometry    (dict, required) — raw geometry object (JSONB)

    Returns:
        201 Created — the newly created zone.
        400         — validation error or malformed JSON.
        404         — property not found or not owned by user.
    """
    user_id: str = get_jwt_identity()

    body = request.get_json(silent=True)
    if body is None:
        return _error(400, "Bad Request", "Request body must be valid JSON.")

    try:
        data = _create_schema.load(body)
    except ValidationError as exc:
        return _error(400, "Bad Request", exc.messages)

    try:
        zone = ZoneService.create_zone(
            property_id,
            user_id,
            name=data["name"],
            zone_type=data["type"],
            status=data["status"],
            mower_count=data["mower_count"],
            geometry=data["geometry"],
        )
    except ZoneError as exc:
        return _service_error(exc)

    return _ok({"zone": dump_zone(zone)}, 201)


@zones_bp.put("/<string:zone_id>")
@jwt_required()
def update_zone(property_id: str, zone_id: str):
    """Partially update a zone.

    All body fields are optional — only fields present are changed.

    Returns:
        200 OK  — updated zone object.
        400     — validation error or malformed JSON.
        404     — property or zone not found / not owned by user.
    """
    user_id: str = get_jwt_identity()

    body = request.get_json(silent=True)
    if body is None:
        return _error(400, "Bad Request", "Request body must be valid JSON.")

    if not body:
        return _error(400, "Bad Request", "Request body must not be empty.")

    try:
        data = _update_schema.load(body)
    except ValidationError as exc:
        return _error(400, "Bad Request", exc.messages)

    try:
        zone = ZoneService.update_zone(property_id, zone_id, user_id, data)
    except ZoneError as exc:
        return _service_error(exc)

    return _ok({"zone": dump_zone(zone)})


@zones_bp.delete("/<string:zone_id>")
@jwt_required()
def delete_zone(property_id: str, zone_id: str):
    """Delete a zone.

    Returns:
        200 OK  — confirmation message.
        404     — property or zone not found / not owned by user.
    """
    user_id: str = get_jwt_identity()

    try:
        ZoneService.delete_zone(property_id, zone_id, user_id)
    except ZoneError as exc:
        return _service_error(exc)

    return _ok({"message": f"Zone '{zone_id}' deleted successfully."})


@zones_bp.get("/summary")
@jwt_required()
def get_zones_summary(property_id: str):
    """Return aggregated statistics for all zones in a property.

    Returns:
        200 OK  — summary object with totalZones, totalArea,
                   totalMowers, and understaffedCount.
        404     — property not found or not owned by user.
    """
    user_id: str = get_jwt_identity()

    try:
        summary = ZoneService.get_zones_summary(property_id, user_id)
    except ZoneError as exc:
        return _service_error(exc)

    return _ok(summary)


@zones_bp.post("/import")
@jwt_required()
def import_zones(property_id: str):
    """Bulk-import zones from a GeoJSON FeatureCollection.

    Accepts a GeoJSON FeatureCollection.  Every feature must carry a
    Polygon or MultiPolygon geometry.  Zone metadata (name, type, status,
    mower_count) is read from each feature's ``properties`` object;
    missing fields receive sensible defaults.

    The entire import is atomic — if any feature is invalid or the DB
    write fails, nothing is persisted.

    Request body (JSON):
        type     (str, required)   — must be "FeatureCollection"
        features (list, required)  — one or more GeoJSON Feature objects

    Returns:
        201 Created — list of imported zones + import count.
        400         — top-level structural errors or per-feature errors.
        404         — property not found or not owned by user.
    """
    user_id: str = get_jwt_identity()

    body = request.get_json(silent=True)
    if body is None:
        return _error(400, "Bad Request", "Request body must be valid JSON.")

    try:
        data = _import_schema.load(body)
    except ValidationError as exc:
        return _error(400, "Bad Request", exc.messages)

    try:
        zones = ZoneService.import_zones(
            property_id,
            user_id,
            features=data["features"],
        )
    except ZoneError as exc:
        return _service_error(exc)

    return _ok(
        {
            "imported": len(zones),
            "zones": dump_zones(zones),
        },
        201,
    )
