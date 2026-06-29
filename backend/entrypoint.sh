#!/usr/bin/env bash
# entrypoint.sh — Docker container startup sequence
# 1. Wait for PostgreSQL to be ready
# 2. Initialize / run database migrations (idempotent)
# 3. Seed demo data on first boot (idempotent)
# 4. Hand off to gunicorn

set -euo pipefail

# ── 1. Wait for PostgreSQL ─────────────────────────────────────────────────
echo "[entrypoint] Waiting for PostgreSQL at postgres:5432..."
until pg_isready -h postgres -p 5432 -U "${POSTGRES_USER:-vzm_user}" -q; do
  echo "[entrypoint]   still waiting..."
  sleep 2
done
echo "[entrypoint] PostgreSQL is ready."

# ── 2. Database migrations ─────────────────────────────────────────────────
if [ ! -d "/app/migrations" ]; then
  echo "[entrypoint] No migrations folder found — initialising Flask-Migrate..."
  flask db init
  flask db migrate -m "initial schema"
fi

echo "[entrypoint] Running flask db upgrade..."
flask db upgrade
echo "[entrypoint] Migrations complete."

# ── 3. Seed demo data ──────────────────────────────────────────────────────
echo "[entrypoint] Seeding demo data (skipped if already present)..."
python seed.py
echo "[entrypoint] Seeding complete."

# ── 4. Start application server ───────────────────────────────────────────
echo "[entrypoint] Starting gunicorn..."
exec gunicorn \
  --bind 0.0.0.0:5000 \
  --workers 2 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile - \
  wsgi:app
