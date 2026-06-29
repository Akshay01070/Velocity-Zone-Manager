"""
app/services/zone_service.py — Business logic for zone management.

ZoneService is framework-agnostic: no Flask request/response objects.
It raises plain Python exceptions that routes translate into HTTP responses.

Ownership is enforced by first verifying that the parent Property belongs
to the requesting user before any zone operation proceeds.

Exceptions
----------
ZoneError        — base class (message, http_status)
ZoneNotFoundError — 404 Not Found
"""

from __future__ import annotations

from app.models.property import Property
from app.models.zone import Zone, ZoneStatus, ZoneType
from app.repositories import property_repository as prop_repo
from app.repositories import zone_repository as zone_repo


# ── Custom exceptions ──────────────────────────────────────────────────────

class ZoneError(Exception):
    """Base zone exception carrying an HTTP status code."""

    def __init__(self, message: str, http_status: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.http_status = http_status


class ZoneNotFoundError(ZoneError):
    def __init__(self, zone_id: str) -> None:
        super().__init__(f"Zone '{zone_id}' not found.", 404)


class PropertyNotFoundError(ZoneError):
    """Raised when the parent property does not exist / is not owned by user."""

    def __init__(self, property_id: str) -> None:
        super().__init__(f"Property '{property_id}' not found.", 404)


# ── Service ────────────────────────────────────────────────────────────────

class ZoneService:
    """Handles all business logic for Zone CRUD.

    Every public method receives *user_id* and verifies property ownership
    before touching zone data — zones cannot be accessed across properties
    or across users.
    """

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    @staticmethod
    def list_zones(property_id: str, user_id: str) -> list[Zone]:
        """Return all zones for a property owned by the user.

        Args:
            property_id: Parent property UUID.
            user_id:     Authenticated user's id.

        Returns:
            List of :class:`Zone` instances (may be empty).

        Raises:
            :class:`PropertyNotFoundError`: if property doesn't exist or
                belongs to another user.
        """
        ZoneService._assert_property_owned(property_id, user_id)
        return zone_repo.list_zones_for_property(property_id)

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    @staticmethod
    def create_zone(
        property_id: str,
        user_id: str,
        *,
        name: str,
        zone_type: str,
        status: str = ZoneStatus.ACTIVE.value,
        mower_count: int = 0,
        geometry: dict,
    ) -> Zone:
        """Create a new zone inside a property.

        Args:
            property_id:  Parent property UUID.
            user_id:      Must own the property.
            name:         Zone name.
            zone_type:    One of the ZoneType value strings.
            status:       One of the ZoneStatus value strings (default Active).
            mower_count:  Number of mowers assigned (default 0).
            geometry:     Raw geometry dict stored as JSONB.

        Returns:
            The newly created :class:`Zone`.

        Raises:
            :class:`PropertyNotFoundError`: if property not found / not owned.
        """
        ZoneService._assert_property_owned(property_id, user_id)

        return zone_repo.create_zone(
            property_id=property_id,
            name=name.strip(),
            zone_type=ZoneType(zone_type),
            status=ZoneStatus(status),
            mower_count=mower_count,
            geometry=geometry,
        )

    @staticmethod
    def update_zone(
        property_id: str,
        zone_id: str,
        user_id: str,
        updates: dict,
    ) -> Zone:
        """Apply partial updates to a zone.

        Args:
            property_id: Parent property UUID.
            zone_id:     Target zone UUID.
            user_id:     Must own the parent property.
            updates:     Dict of fields to patch (only present keys applied).

        Returns:
            The updated :class:`Zone`.

        Raises:
            :class:`PropertyNotFoundError`: if property not found / not owned.
            :class:`ZoneNotFoundError`: if zone not found in this property.
        """
        ZoneService._assert_property_owned(property_id, user_id)

        zone = zone_repo.get_zone_by_id(zone_id, property_id)
        if zone is None:
            raise ZoneNotFoundError(zone_id)

        return zone_repo.update_zone(zone, updates)

    @staticmethod
    def delete_zone(property_id: str, zone_id: str, user_id: str) -> None:
        """Delete a zone from a property.

        Args:
            property_id: Parent property UUID.
            zone_id:     Target zone UUID.
            user_id:     Must own the parent property.

        Raises:
            :class:`PropertyNotFoundError`: if property not found / not owned.
            :class:`ZoneNotFoundError`: if zone not found in this property.
        """
        ZoneService._assert_property_owned(property_id, user_id)

        zone = zone_repo.get_zone_by_id(zone_id, property_id)
        if zone is None:
            raise ZoneNotFoundError(zone_id)

        zone_repo.delete_zone(zone)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _assert_property_owned(property_id: str, user_id: str) -> Property:
        """Raise PropertyNotFoundError if the property doesn't exist or
        is not owned by *user_id*."""
        prop = prop_repo.get_property_by_id(property_id, user_id)
        if prop is None:
            raise PropertyNotFoundError(property_id)
        return prop
