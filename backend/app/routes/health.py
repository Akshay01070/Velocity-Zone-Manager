"""
app/routes/health.py — System health-check endpoint.

GET /health
  → 200 {"status": "ok"}

Also checks database connectivity when the DB is reachable so that
load-balancer probes can distinguish an app crash from a DB outage.
"""

from flask import Blueprint, jsonify
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.extensions import db

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health():
    """Return service liveness status.

    Performs a lightweight DB ping so that the response reflects
    full stack health, not just Flask process health.
    """
    db_status = "ok"
    try:
        db.session.execute(text("SELECT 1"))
    except OperationalError:
        db_status = "unavailable"

    payload = {
        "status": "ok",
        "database": db_status,
    }
    http_status = 200 if db_status == "ok" else 503
    return jsonify(payload), http_status
