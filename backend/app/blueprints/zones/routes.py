"""
app/blueprints/zones/routes.py — Zones blueprint route stubs.

Endpoints:
  GET    /api/v1/zones/       — List all velocity zones
  POST   /api/v1/zones/       — Create a new velocity zone
  GET    /api/v1/zones/<id>   — Retrieve a single zone
  PUT    /api/v1/zones/<id>   — Update an existing zone
  DELETE /api/v1/zones/<id>   — Delete a zone

Business logic will be implemented in a future iteration.
"""

from flask import Blueprint, jsonify

zones_bp = Blueprint("zones", __name__)


@zones_bp.get("/")
def list_zones():
    """Return a paginated list of velocity zones."""
    # TODO: Implement zone listing logic
    return jsonify({"message": "list zones — not yet implemented"}), 501


@zones_bp.post("/")
def create_zone():
    """Create a new velocity zone."""
    # TODO: Implement zone creation logic
    return jsonify({"message": "create zone — not yet implemented"}), 501


@zones_bp.get("/<string:zone_id>")
def get_zone(zone_id: str):
    """Retrieve a single velocity zone by ID."""
    # TODO: Implement single-zone retrieval
    return jsonify({"message": f"get zone {zone_id} — not yet implemented"}), 501


@zones_bp.put("/<string:zone_id>")
def update_zone(zone_id: str):
    """Update an existing velocity zone."""
    # TODO: Implement zone update logic
    return jsonify({"message": f"update zone {zone_id} — not yet implemented"}), 501


@zones_bp.delete("/<string:zone_id>")
def delete_zone(zone_id: str):
    """Delete a velocity zone."""
    # TODO: Implement zone deletion logic
    return jsonify({"message": f"delete zone {zone_id} — not yet implemented"}), 501
