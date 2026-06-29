"""
app/services/property_service.py — Business logic for property management.

PropertyService is framework-agnostic: no Flask request/response objects.
It raises plain Python exceptions that routes translate into HTTP responses.

Exceptions
----------
PropertyError    — base class (message, http_status)
PropertyNotFound — 404 Not Found
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.models.property import Property, PropertyType
from app.repositories import property_repository as repo


# ── Custom exceptions ──────────────────────────────────────────────────────

class PropertyError(Exception):
    """Base property exception carrying an HTTP status code."""

    def __init__(self, message: str, http_status: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.http_status = http_status


class PropertyNotFoundError(PropertyError):
    def __init__(self, property_id: str) -> None:
        super().__init__(f"Property '{property_id}' not found.", 404)


# ── Result dataclasses ─────────────────────────────────────────────────────

@dataclass(frozen=True)
class PropertyListResult:
    """Returned by list_properties."""

    items: list[Property]
    total: int
    page: int
    limit: int

    @property
    def pages(self) -> int:
        if self.limit == 0:
            return 0
        return -(-self.total // self.limit)  # ceiling division


# ── Service ────────────────────────────────────────────────────────────────

class PropertyService:
    """Handles all business logic for Property CRUD."""

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    @staticmethod
    def list_properties(
        user_id: str,
        *,
        search: str | None = None,
        type_filter: str | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> PropertyListResult:
        """Return a paginated list of the user's properties.

        Args:
            user_id:     Authenticated user's id.
            search:      Case-insensitive substring filter on name.
            type_filter: Exact PropertyType value string filter.
            page:        1-indexed page number.
            limit:       Page size.

        Returns:
            :class:`PropertyListResult`.
        """
        items, total = repo.list_properties(
            user_id,
            search=search,
            type_filter=type_filter,
            page=page,
            limit=limit,
        )
        return PropertyListResult(items=items, total=total, page=page, limit=limit)

    @staticmethod
    def get_property(property_id: str, user_id: str) -> Property:
        """Return a single property owned by the user.

        Raises:
            :class:`PropertyNotFoundError`: if not found or owned by another user.
        """
        prop = repo.get_property_by_id(property_id, user_id)
        if prop is None:
            raise PropertyNotFoundError(property_id)
        return prop

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    @staticmethod
    def create_property(
        user_id: str,
        *,
        name: str,
        property_type: str,
        total_acreage: float | None = None,
        notes: str | None = None,
    ) -> Property:
        """Create and persist a new Property.

        Args:
            user_id:       Owner's user id.
            name:          Property name (already stripped).
            property_type: One of the PropertyType value strings.
            total_acreage: Optional acreage.
            notes:         Optional free-text notes.

        Returns:
            The newly created :class:`Property` instance.
        """
        enum_type = PropertyType(property_type)
        return repo.create_property(
            user_id=user_id,
            name=name.strip(),
            property_type=enum_type,
            total_acreage=total_acreage,
            notes=notes,
        )

    @staticmethod
    def update_property(
        property_id: str,
        user_id: str,
        updates: dict,
    ) -> Property:
        """Apply partial updates to an existing Property.

        Args:
            property_id: Target property UUID.
            user_id:     Must match the property's owner.
            updates:     Dict of fields to update (only present keys applied).

        Returns:
            The updated :class:`Property` instance.

        Raises:
            :class:`PropertyNotFoundError`: if not found or not owned by user.
        """
        prop = repo.get_property_by_id(property_id, user_id)
        if prop is None:
            raise PropertyNotFoundError(property_id)
        return repo.update_property(prop, updates)

    @staticmethod
    def delete_property(property_id: str, user_id: str) -> None:
        """Delete a property and cascade to its zones.

        Raises:
            :class:`PropertyNotFoundError`: if not found or not owned by user.
        """
        prop = repo.get_property_by_id(property_id, user_id)
        if prop is None:
            raise PropertyNotFoundError(property_id)
        repo.delete_property(prop)
