"""
app/middleware/error_handlers.py — Global HTTP error handlers.

Registered on the Flask app inside register_error_handlers() which
is called by create_app().  Returns consistent JSON error envelopes
for all error classes so that API clients have a predictable shape.

Error envelope:
  {
    "error": {
      "code":    <http_status_int>,
      "status":  "<HTTP reason phrase>",
      "message": "<human-readable description>"
    }
  }

JWT error callbacks are also registered here so that authentication
failures (missing/expired/invalid tokens) return the same envelope
instead of Flask-JWT-Extended's default responses.
"""

from __future__ import annotations

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException


def register_error_handlers(app: Flask) -> None:
    """Attach JSON error handlers to *app*."""

    # ── Generic Werkzeug HTTP exceptions ──────────────────────────────────

    @app.errorhandler(HTTPException)
    def handle_http_exception(exc: HTTPException):
        """Convert Werkzeug HTTP exceptions to JSON."""
        return (
            jsonify(
                {
                    "error": {
                        "code": exc.code,
                        "status": exc.name,
                        "message": exc.description,
                    }
                }
            ),
            exc.code,
        )

    @app.errorhandler(Exception)
    def handle_unexpected_exception(exc: Exception):
        """Catch-all handler — prevents stack traces leaking to clients."""
        app.logger.exception("Unhandled exception: %s", exc)
        return (
            jsonify(
                {
                    "error": {
                        "code": 500,
                        "status": "Internal Server Error",
                        "message": "An unexpected error occurred.",
                    }
                }
            ),
            500,
        )

    # ── Flask-JWT-Extended callbacks ───────────────────────────────────────
    # These override the library's default plain-text responses so that JWT
    # errors match the project-wide error envelope.

    from flask_jwt_extended import JWTManager

    jwt: JWTManager = app.extensions["flask-jwt-extended"]

    @jwt.unauthorized_loader
    def missing_token_callback(reason: str):
        """No Authorization header provided."""
        return (
            jsonify(
                {
                    "error": {
                        "code": 401,
                        "status": "Unauthorized",
                        "message": f"Missing authentication token: {reason}",
                    }
                }
            ),
            401,
        )

    @jwt.invalid_token_loader
    def invalid_token_callback(reason: str):
        """Token present but structurally invalid."""
        return (
            jsonify(
                {
                    "error": {
                        "code": 422,
                        "status": "Unprocessable Entity",
                        "message": f"Invalid token: {reason}",
                    }
                }
            ),
            422,
        )

    @jwt.expired_token_loader
    def expired_token_callback(_jwt_header: dict, _jwt_payload: dict):
        """Token has passed its expiry time."""
        return (
            jsonify(
                {
                    "error": {
                        "code": 401,
                        "status": "Unauthorized",
                        "message": "Access token has expired. Please log in again.",
                    }
                }
            ),
            401,
        )

    @jwt.revoked_token_loader
    def revoked_token_callback(_jwt_header: dict, _jwt_payload: dict):
        """Token has been explicitly revoked (e.g., logout blacklist)."""
        return (
            jsonify(
                {
                    "error": {
                        "code": 401,
                        "status": "Unauthorized",
                        "message": "Token has been revoked. Please log in again.",
                    }
                }
            ),
            401,
        )
