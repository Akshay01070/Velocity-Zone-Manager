"""
app/middleware/request_logger.py — Per-request logging middleware.

Logs method, path, status code, and elapsed time for every request.
Registered via register_request_logger() called inside create_app().

Log format (INFO level):
  [REQUEST]  POST /api/v1/auth/login  →  200  (12ms)
"""

from __future__ import annotations

import time

from flask import Flask, g, request


def register_request_logger(app: Flask) -> None:
    """Attach before/after request hooks that emit timing logs."""

    @app.before_request
    def _start_timer() -> None:
        g.request_start = time.perf_counter()

    @app.after_request
    def _log_request(response):
        elapsed_ms = (time.perf_counter() - g.request_start) * 1000
        app.logger.info(
            "[REQUEST]  %s %s  →  %s  (%.1fms)",
            request.method,
            request.path,
            response.status_code,
            elapsed_ms,
        )
        return response
