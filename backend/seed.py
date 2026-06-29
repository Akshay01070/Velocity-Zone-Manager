"""
seed.py — Idempotent demo-data seeder.

Run directly:  python seed.py
Run via Flask: flask shell -c "exec(open('seed.py').read())"

Guard: skips everything if the demo user already exists so re-running
on container restart is safe.
"""

from __future__ import annotations

import sys

from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.property import Property, PropertyType
from app.models.zone import Zone, ZoneType, ZoneStatus

# ── Demo credentials (visible in README / docs only) ──────────────────────
DEMO_EMAIL = "demo@velocityzone.dev"
DEMO_PASSWORD = "Demo1234!"
DEMO_FULL_NAME = "Demo User"

# ── Demo property ──────────────────────────────────────────────────────────
DEMO_PROPERTY_NAME = "Pebble Beach Golf Links"
DEMO_PROPERTY_TYPE = PropertyType.GOLF_COURSE
DEMO_PROPERTY_ACREAGE = 220.0
DEMO_PROPERTY_NOTES = "Iconic oceanside golf course — seeded demo property."

# ── Demo zones (GeoJSON Polygon geometry) ─────────────────────────────────
# Coordinates roughly centred on Pebble Beach, CA (36.57°N 121.95°W)
# Each zone is a distinct, non-overlapping polygon.

DEMO_ZONES = [
    {
        "name": "Hole 18 Fairway",
        "type": ZoneType.FAIRWAY,
        "status": ZoneStatus.ACTIVE,
        "mower_count": 3,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-121.9510, 36.5673],
                    [-121.9502, 36.5673],
                    [-121.9502, 36.5680],
                    [-121.9510, 36.5680],
                    [-121.9510, 36.5673],
                ]
            ],
        },
    },
    {
        "name": "North Perimeter",
        "type": ZoneType.PERIMETER,
        "status": ZoneStatus.ACTIVE,
        "mower_count": 1,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-121.9530, 36.5690],
                    [-121.9510, 36.5690],
                    [-121.9510, 36.5700],
                    [-121.9530, 36.5700],
                    [-121.9530, 36.5690],
                ]
            ],
        },
    },
    {
        "name": "Coastal Exclusion Zone",
        "type": ZoneType.EXCLUSION,
        "status": ZoneStatus.INACTIVE,
        "mower_count": 0,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-121.9550, 36.5660],
                    [-121.9535, 36.5660],
                    [-121.9535, 36.5672],
                    [-121.9550, 36.5672],
                    [-121.9550, 36.5660],
                ]
            ],
        },
    },
]


def seed() -> None:
    """Insert demo data if not already present."""
    app = create_app()

    with app.app_context():
        # Guard: skip if demo user already exists
        existing = db.session.execute(
            db.select(User).where(User.email == DEMO_EMAIL)
        ).scalar_one_or_none()

        if existing is not None:
            print(f"[seed] Demo user '{DEMO_EMAIL}' already exists — skipping.")
            return

        # ── Create demo user ───────────────────────────────────────────────
        user = User(
            email=DEMO_EMAIL,
            password_hash=generate_password_hash(DEMO_PASSWORD),
            full_name=DEMO_FULL_NAME,
        )
        db.session.add(user)
        db.session.flush()  # populate user.id before FK reference

        print(f"[seed] Created user: {DEMO_EMAIL} (id={user.id})")

        # ── Create demo property ───────────────────────────────────────────
        prop = Property(
            name=DEMO_PROPERTY_NAME,
            type=DEMO_PROPERTY_TYPE,
            total_acreage=DEMO_PROPERTY_ACREAGE,
            notes=DEMO_PROPERTY_NOTES,
            user_id=user.id,
        )
        db.session.add(prop)
        db.session.flush()  # populate prop.id before FK reference

        print(f"[seed] Created property: {DEMO_PROPERTY_NAME} (id={prop.id})")

        # ── Create demo zones ──────────────────────────────────────────────
        for zone_data in DEMO_ZONES:
            zone = Zone(
                name=zone_data["name"],
                type=zone_data["type"],
                status=zone_data["status"],
                mower_count=zone_data["mower_count"],
                geometry=zone_data["geometry"],
                property_id=prop.id,
            )
            db.session.add(zone)
            print(f"[seed]   Created zone: {zone_data['name']} ({zone_data['type'].value})")

        db.session.commit()
        print("[seed] Demo data committed successfully.")
        print()
        print("  ┌─────────────────────────────────────────────┐")
        print("  │  Demo credentials                           │")
        print(f"  │  Email   : {DEMO_EMAIL:<33}│")
        print(f"  │  Password: {DEMO_PASSWORD:<33}│")
        print("  └─────────────────────────────────────────────┘")


if __name__ == "__main__":
    seed()
    sys.exit(0)
