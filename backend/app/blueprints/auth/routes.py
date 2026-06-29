"""
app/blueprints/auth/routes.py — Auth blueprint route stubs.

Endpoints:
  POST /api/v1/auth/register  — Register a new user
  POST /api/v1/auth/login     — Obtain JWT access + refresh tokens
  POST /api/v1/auth/refresh   — Rotate access token using refresh token
  GET  /api/v1/auth/me        — Return the current authenticated user

Business logic will be implemented in a future iteration.
"""

from flask import Blueprint, jsonify

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    """Register a new user account."""
    # TODO: Implement registration logic
    return jsonify({"message": "register endpoint — not yet implemented"}), 501


@auth_bp.post("/login")
def login():
    """Authenticate a user and return JWT tokens."""
    # TODO: Implement login logic
    return jsonify({"message": "login endpoint — not yet implemented"}), 501


@auth_bp.post("/refresh")
def refresh():
    """Refresh the access token using a valid refresh token."""
    # TODO: Implement token refresh logic
    return jsonify({"message": "refresh endpoint — not yet implemented"}), 501


@auth_bp.get("/me")
def me():
    """Return the currently authenticated user's profile."""
    # TODO: Implement profile retrieval logic
    return jsonify({"message": "me endpoint — not yet implemented"}), 501
