/**
 * src/pages/NotFoundPage.tsx — 404 catch-all page.
 */

import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="not-found">
      <span className="not-found-code" aria-hidden="true">404</span>
      <h1 className="not-found-title">Page not found</h1>
      <p className="not-found-body">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        Back to Dashboard
      </Link>
    </div>
  );
}
