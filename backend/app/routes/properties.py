"""
app/routes/properties.py — Properties CRUD blueprint (JWT-protected).

All routes require a valid Bearer token.

Routes
------
GET    /api/v1/properties          List authenticated user's properties.
GET    /api/v1/properties/<id>     Get a single property by id.
POST   /api/v1/properties          Create a new property.
PUT    /api/v1/properties/<id>     Fully/partially update a property.
DELETE /api/v1/properties/<id>     Delete a property and its zones.

Query parameters for GET /properties:
    search (str)  — case-insensitive name substring match
    type   (str)  — exact PropertyType value filter
    page   (int)  — 1-indexed page (default 1)
    limit  (int)  — page size, 1–100 (default 20)

Success envelope:
    { "data": { ... } }

Error envelope:
    { "error": { "code": N, "status": "...", "message": "..." } }
"""

from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from app.schemas.property import (
    PropertyCreateSchema,
    PropertyListQuerySchema,
    PropertyUpdateSchema,
    dump_properties,
    dump_property,
)
from app.services.property_service import PropertyError, PropertyService

properties_bp = Blueprint("properties", __name__)

# Schema singletons — instantiated once at module load.
_create_schema = PropertyCreateSchema()
_update_schema = PropertyUpdateSchema()
_list_query_schema = PropertyListQuerySchema()


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


def _service_error(exc: PropertyError):
    return _error(exc.http_status, _status_name(exc.http_status), exc.message)


# ── Endpoints ──────────────────────────────────────────────────────────────

@properties_bp.get("/")
@jwt_required()
def list_properties():
    """List all properties for the authenticated user.

    Query params: search, type, page, limit
    Returns 200 with paginated results.
    """
    user_id: str = get_jwt_identity()

    try:
        params = _list_query_schema.load(request.args.to_dict())
    except ValidationError as exc:
        return _error(400, "Bad Request", exc.messages)

    result = PropertyService.list_properties(
        user_id,
        search=params.get("search"),
        type_filter=params.get("type"),
        page=params["page"],
        limit=params["limit"],
    )

    return _ok(
        {
            "properties": dump_properties(result.items),
            "pagination": {
                "total": result.total,
                "page": result.page,
                "limit": result.limit,
                "pages": result.pages,
            },
        }
    )


@properties_bp.get("/<string:property_id>")
@jwt_required()
def get_property(property_id: str):
    """Retrieve a single property by id.

    Returns 200 with the property object.
    Returns 404 if not found or owned by another user.
    """
    user_id: str = get_jwt_identity()

    try:
        prop = PropertyService.get_property(property_id, user_id)
    except PropertyError as exc:
        return _service_error(exc)

    return _ok({"property": dump_property(prop)})


@properties_bp.post("/")
@jwt_required()
def create_property():
    """Create a new property for the authenticated user.

    Request body (JSON):
        name          (str, required)
        type          (str, required) — one of the PropertyType values
        total_acreage (float, optional)
        notes         (str, optional)

    Returns 201 with the created property.
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
        prop = PropertyService.create_property(
            user_id,
            name=data["name"],
            property_type=data["type"],
            total_acreage=data.get("total_acreage"),
            notes=data.get("notes"),
        )
    except PropertyError as exc:
        return _service_error(exc)

    return _ok({"property": dump_property(prop)}, 201)


@properties_bp.put("/<string:property_id>")
@jwt_required()
def update_property(property_id: str):
    """Update an existing property.

    Supports partial updates — only fields present in the body are changed.

    Returns 200 with the updated property.
    Returns 404 if not found or owned by another user.
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
        prop = PropertyService.update_property(property_id, user_id, data)
    except PropertyError as exc:
        return _service_error(exc)

    return _ok({"property": dump_property(prop)})


@properties_bp.delete("/<string:property_id>")
@jwt_required()
def delete_property(property_id: str):
    """Delete a property and all its zones.

    Returns 200 with a confirmation message.
    Returns 404 if not found or owned by another user.
    """
    user_id: str = get_jwt_identity()

    try:
        PropertyService.delete_property(property_id, user_id)
    except PropertyError as exc:
        return _service_error(exc)

    return _ok({"message": f"Property '{property_id}' deleted successfully."})
