"""
app/routes/auth.py — Authentication blueprint.

Routes
------
POST /api/v1/auth/signup   Register a new user account.
POST /api/v1/auth/login    Obtain a JWT access token.

All responses follow the project's standard envelope:
  success → { "data": { ... } }
  error   → { "error": { "code": N, "status": "...", "message": "..." } }
"""

from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from marshmallow import ValidationError

from app.models.user import User
from app.extensions import db
from app.schemas.auth import LoginSchema, SignupSchema
from app.services.auth_service import AuthError, AuthService

auth_bp = Blueprint("auth", __name__)

_signup_schema = SignupSchema()
_login_schema = LoginSchema()


# ── Helpers ────────────────────────────────────────────────────────────────

def _error(code: int, status: str, message: str):
    """Return a standard JSON error envelope."""
    return jsonify({"error": {"code": code, "status": status, "message": message}}), code


def _ok(data: dict, code: int = 200):
    """Return a standard JSON success envelope."""
    return jsonify({"data": data}), code


# ── Endpoints ──────────────────────────────────────────────────────────────

@auth_bp.post("/signup")
def signup():
    """Register a new user and return a JWT access token.

    Request body (JSON):
        email     (str, required) — valid e-mail address
        password  (str, required) — min 8 characters
        full_name (str, required) — non-blank display name

    Returns:
        201 Created  — account created, token issued
        400 Bad Request — validation failure or malformed JSON
        409 Conflict — e-mail already registered
    """
    body = request.get_json(silent=True)
    if body is None:
        return _error(400, "Bad Request", "Request body must be valid JSON.")

    try:
        data = _signup_schema.load(body)
    except ValidationError as exc:
        return _error(400, "Bad Request", exc.messages)

    try:
        result = AuthService.signup(
            email=data["email"],
            password=data["password"],
            full_name=data["full_name"],
        )
    except AuthError as exc:
        return _error(exc.http_status, _http_status_name(exc.http_status), exc.message)

    return _ok(
        {
            "access_token": result.access_token,
            "token_type": "Bearer",
            "user": {
                "id": result.user_id,
                "email": result.email,
                "full_name": result.full_name,
            },
        },
        201,
    )


@auth_bp.get("/me")
@jwt_required()
def me():
    """Return the currently authenticated user's profile.

    Requires a valid Bearer token in the Authorization header.

    Returns:
        200 OK          — user profile object
        401 Unauthorized — missing or invalid token
        404 Not Found   — user deleted after token was issued
    """
    user_id: str = get_jwt_identity()
    user: User | None = db.session.get(User, user_id)

    if user is None:
        return _error(404, "Not Found", "User not found.")

    if not user.is_active:
        return _error(403, "Forbidden", "This account has been deactivated.")

    return _ok({
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat(),
    })



@auth_bp.post("/login")
def login():
    """Authenticate an existing user and return a JWT access token.

    Request body (JSON):
        email    (str, required)
        password (str, required)

    Returns:
        200 OK          — credentials valid, token issued
        400 Bad Request — validation failure or malformed JSON
        401 Unauthorized — wrong email or password
        403 Forbidden    — account deactivated
    """
    body = request.get_json(silent=True)
    if body is None:
        return _error(400, "Bad Request", "Request body must be valid JSON.")

    try:
        data = _login_schema.load(body)
    except ValidationError as exc:
        return _error(400, "Bad Request", exc.messages)

    try:
        result = AuthService.login(
            email=data["email"],
            password=data["password"],
        )
    except AuthError as exc:
        return _error(exc.http_status, _http_status_name(exc.http_status), exc.message)

    return _ok(
        {
            "access_token": result.access_token,
            "token_type": "Bearer",
            "user": {
                "id": result.user_id,
                "email": result.email,
                "full_name": result.full_name,
            },
        }
    )


# ── Internal utility ───────────────────────────────────────────────────────

_STATUS_NAMES: dict[int, str] = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    500: "Internal Server Error",
}


def _http_status_name(code: int) -> str:
    return _STATUS_NAMES.get(code, "Error")
