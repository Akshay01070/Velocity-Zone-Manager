"""
app/services/auth_service.py — Business logic for authentication.

AuthService is framework-agnostic: no Flask request/response objects.
It raises plain Python exceptions so that callers (routes) decide the
HTTP status code.

Exceptions
----------
AuthError           — base class (message, http_status)
DuplicateEmailError — 409 Conflict
InvalidCredentials  — 401 Unauthorized
"""

from __future__ import annotations

from dataclasses import dataclass

from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db
from app.models.user import User


# ── Custom exceptions ──────────────────────────────────────────────────────

class AuthError(Exception):
    """Base auth exception carrying an HTTP status code."""

    def __init__(self, message: str, http_status: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.http_status = http_status


class DuplicateEmailError(AuthError):
    def __init__(self) -> None:
        super().__init__("An account with this email already exists.", 409)


class InvalidCredentialsError(AuthError):
    def __init__(self) -> None:
        super().__init__("Invalid email or password.", 401)


# ── Result dataclass ───────────────────────────────────────────────────────

@dataclass(frozen=True)
class AuthResult:
    """Returned by both signup and login on success."""

    access_token: str
    user_id: str
    email: str
    full_name: str


# ── Service ────────────────────────────────────────────────────────────────

class AuthService:
    """Handles user registration and token-based login."""

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    @staticmethod
    def signup(email: str, password: str, full_name: str) -> AuthResult:
        """Register a new user.

        Args:
            email:      Normalised (lower-cased, stripped) email address.
            password:   Plain-text password (will be hashed here).
            full_name:  Display name.

        Returns:
            :class:`AuthResult` with a freshly minted JWT.

        Raises:
            :class:`DuplicateEmailError`: if the email is already registered.
        """
        AuthService._assert_email_unique(email)

        user = User(
            email=email,
            password_hash=generate_password_hash(password),
            full_name=full_name,
        )
        db.session.add(user)
        db.session.commit()

        return AuthService._build_result(user)

    @staticmethod
    def login(email: str, password: str) -> AuthResult:
        """Authenticate an existing user.

        Args:
            email:    Normalised email address.
            password: Plain-text password to verify.

        Returns:
            :class:`AuthResult` with a freshly minted JWT.

        Raises:
            :class:`InvalidCredentialsError`: if email not found or
                password does not match.
        """
        user: User | None = db.session.execute(
            db.select(User).where(User.email == email)
        ).scalar_one_or_none()

        # Constant-time comparison — don't short-circuit on missing user
        dummy_hash = generate_password_hash("dummy")
        stored_hash = user.password_hash if user else dummy_hash

        if not check_password_hash(stored_hash, password) or user is None:
            raise InvalidCredentialsError()

        if not user.is_active:
            raise AuthError("This account has been deactivated.", 403)

        return AuthService._build_result(user)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _assert_email_unique(email: str) -> None:
        exists = db.session.execute(
            db.select(User.id).where(User.email == email)
        ).scalar_one_or_none()
        if exists is not None:
            raise DuplicateEmailError()

    @staticmethod
    def _build_result(user: User) -> AuthResult:
        """Create an AuthResult with a JWT whose identity is the user's id."""
        token = create_access_token(identity=user.id)
        return AuthResult(
            access_token=token,
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
        )
