"""
app/routes/properties.py — Properties blueprint (JWT-protected).

All routes in this blueprint require a valid Bearer token issued by
/api/v1/auth/login or /api/v1/auth/signup.

Current routes (stubs — to be expanded with full CRUD):
    GET  /api/v1/properties        List properties for the current user.
    POST /api/v1/properties        Create a new property.

The @jwt_required() decorator (from Flask-JWT-Extended) enforces
authentication. Missing or invalid tokens yield 401 Unauthorized
automatically via the JWTManager error callbacks.
"""

from __future__ import annotations

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

properties_bp = Blueprint("properties", __name__)


def _ok(data, code: int = 200):
    return jsonify({"data": data}), code


# ── Protected routes ───────────────────────────────────────────────────────

@properties_bp.get("/")
@jwt_required()
def list_properties():
    """Return all properties owned by the authenticated user.

    Headers:
        Authorization: Bearer <access_token>

    Returns:
        200 OK — list of property objects (empty array if none)
        401 Unauthorized — missing or invalid token
    """
    current_user_id: str = get_jwt_identity()
    # Full implementation will be added when the properties service is built.
    # Returning an empty list now so the route is exercisable end-to-end.
    return _ok({"user_id": current_user_id, "properties": []})


@properties_bp.post("/")
@jwt_required()
def create_property():
    """Create a new property for the authenticated user.

    Headers:
        Authorization: Bearer <access_token>

    Returns:
        201 Created — the newly created property object
        400 Bad Request — validation error
        401 Unauthorized — missing or invalid token
    """
    # Full implementation (schema validation + service call) will be
    # added in the properties feature task.
    return jsonify({"message": "Not yet implemented."}), 501
