"""
app/utils/validators.py — Request-body validation helpers.

Thin wrappers that pull JSON from the Flask request context and
return typed dicts or raise 400 errors via abort().

Usage in a route:
    from app.utils.validators import require_json

    @bp.post("/zones")
    def create_zone():
        body = require_json()
        ...
"""

from __future__ import annotations

from flask import request
from werkzeug.exceptions import BadRequest


def require_json() -> dict:
    """Parse the request body as JSON.

    Raises:
        werkzeug.exceptions.BadRequest: if Content-Type is not JSON
            or the body is not valid JSON.

    Returns:
        Parsed JSON payload as a Python dict.
    """
    if not request.is_json:
        raise BadRequest("Content-Type must be application/json.")
    data = request.get_json(silent=True)
    if data is None:
        raise BadRequest("Request body must be valid JSON.")
    return data  # type: ignore[return-value]
