/**
 * src/pages/ZonesMapPage.tsx
 *
 * Route: /properties/:propertyId/zones
 *
 * Reads the propertyId from the URL and fetches the property name
 * to display in the ZoneMap header.
 */

import { useParams, Link } from "react-router-dom";
import { ZoneMap } from "@/components/map/ZoneMap";
import { useProperty } from "@/hooks/usePropertiesQuery";

export function ZonesMapPage() {
  const { propertyId = "" } = useParams<{ propertyId: string }>();
  const { data: property }  = useProperty(propertyId);

  return (
    <div className="zones-map-page-wrapper">
      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="zone-breadcrumb" aria-label="Breadcrumb">
        <Link to="/properties" className="zone-breadcrumb-link">
          ← Properties
        </Link>
        <span className="zone-breadcrumb-sep" aria-hidden="true">/</span>
        <span className="zone-breadcrumb-current">
          {property?.name ?? "Zone Manager"}
        </span>
      </nav>

      <ZoneMap
        propertyId={propertyId}
        propertyName={property?.name}
      />
    </div>
  );
}
