"""
app/utils/responses.py — HTTP response helpers.

Thin wrappers around jsonify() that enforce a consistent API envelope
across all route handlers.

Success envelope:
  {
    "data":  <payload>,
    "meta":  <optional pagination / extra info>
  }

Error envelope (see middleware/error_handlers.py for HTTP errors):
  {
    "error": {
      "code":    <int>,
      "status":  "<str>",
      "message": "<str>"
    }
  }
"""

from __future__ import annotations

from typing import Any

from flask import jsonify, Response


def success(data: Any, status: int = 200, meta: dict | None = None) -> tuple[Response, int]:
    """Return a 2xx JSON success response.

    Args:
        data:   The primary response payload.
        status: HTTP status code (default 200).
        meta:   Optional metadata dict (e.g. pagination).

    Returns:
        (Response, int) tuple consumed by Flask.
    """
    payload: dict[str, Any] = {"data": data}
    if meta is not None:
        payload["meta"] = meta
    return jsonify(payload), status


def created(data: Any) -> tuple[Response, int]:
    """Shorthand for 201 Created responses."""
    return success(data, status=201)


def no_content() -> tuple[Response, int]:
    """204 No Content — typically used for DELETE responses."""
    return jsonify({}), 204


def error(message: str, status: int = 400, code: str | None = None) -> tuple[Response, int]:
    """Return a JSON error response for *application-level* errors.

    For HTTP-protocol errors (404, 405, …) use the error handlers in
    app.middleware.error_handlers instead.

    Args:
        message: Human-readable error description.
        status:  HTTP status code (default 400).
        code:    Optional machine-readable error code string.
    """
    payload: dict[str, Any] = {
        "error": {
            "code": status,
            "status": "error",
            "message": message,
        }
    }
    if code is not None:
        payload["error"]["error_code"] = code
    return jsonify(payload), status
