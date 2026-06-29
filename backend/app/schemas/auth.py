"""
app/schemas/auth.py — Marshmallow schemas for auth endpoints.

SignupSchema   — validates POST /auth/signup request body.
LoginSchema    — validates POST /auth/login request body.

Both schemas reject unknown fields (Meta.unknown = RAISE) so that
clients cannot sneak in unexpected keys.
"""

from __future__ import annotations

from marshmallow import RAISE, Schema, ValidationError, fields, post_load, validates


class SignupSchema(Schema):
    """Input schema for /auth/signup."""

    class Meta:
        unknown = RAISE

    email = fields.Email(required=True)
    password = fields.String(required=True)
    full_name = fields.String(required=True)

    @validates("email")
    def normalise_email(self, value: str) -> str:  # noqa: D401
        """Strip whitespace and lower-case the address."""
        return value.strip().lower()

    @validates("password")
    def validate_password(self, value: str) -> None:
        if len(value) < 8:
            raise ValidationError("Password must be at least 8 characters.")

    @validates("full_name")
    def validate_full_name(self, value: str) -> None:
        if not value.strip():
            raise ValidationError("full_name must not be blank.")

    @post_load
    def strip_strings(self, data: dict, **kwargs) -> dict:
        """Strip leading/trailing whitespace from string fields."""
        data["full_name"] = data["full_name"].strip()
        return data


class LoginSchema(Schema):
    """Input schema for /auth/login."""

    class Meta:
        unknown = RAISE

    email = fields.Email(required=True)
    password = fields.String(required=True)

    @validates("email")
    def normalise_email(self, value: str) -> str:
        return value.strip().lower()
