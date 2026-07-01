/**
 * src/pages/DashboardPage.tsx — Authenticated landing page.
 *
 * Shows a summary grid of the user's properties with zone stats.
 * Clicking a property card will eventually navigate to /properties/:id.
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProperties } from "@/hooks/useProperties";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

export function DashboardPage() {
  const { user } = useAuth();
  const { properties, isLoading, error, refetch } = useProperties();
  const navigate = useNavigate();

  const greeting = getGreeting();

  return (
    <div className="dashboard">
      {/* ── Header ─────────────────────────────────────────────── */}
      <section className="dashboard-header">
        <div>
          <h2 className="dashboard-greeting">
            {greeting},{" "}
            <span className="dashboard-username">
              {user?.full_name?.split(" ")[0] ?? "there"}
            </span>{" "}
            👋
          </h2>
          <p className="dashboard-subtitle">
            Here's an overview of your properties and zones.
          </p>
        </div>
        <Button
          id="new-property-btn"
          variant="primary"
          onClick={() => navigate("/properties", { state: { openCreate: true } })}
        >
          + New Property
        </Button>
      </section>

      {/* ── Stats strip ────────────────────────────────────────── */}
      <section className="stats-strip" aria-label="Summary statistics">
        <StatCard label="Properties" value={properties.length} icon="⌂" accent="blue" />
        <StatCard
          label="Total Zones"
          value={properties.reduce((acc) => acc, 0)}
          icon="⬡"
          accent="violet"
        />
        <StatCard label="Active Today" value="—" icon="✦" accent="emerald" />
        <StatCard label="Understaffed" value="—" icon="⚠" accent="amber" />
      </section>

      {/* ── Properties grid ────────────────────────────────────── */}
      <section aria-label="Properties">
        <h3 className="section-title">Your Properties</h3>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <div className="alert alert--error" role="alert">
            {error}{" "}
            <button className="underline ml-2" onClick={refetch}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && properties.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">⌂</span>
            <p className="empty-text">No properties yet.</p>
            <Button
              id="empty-new-property-btn"
              onClick={() => navigate("/properties", { state: { openCreate: true } })}
            >
              Create your first property
            </Button>
          </div>
        )}

        {!isLoading && !error && properties.length > 0 && (
          <div className="property-grid">
            {properties.map((prop) => (
              <button
                key={prop.id}
                id={`property-card-${prop.id}`}
                className="property-card"
                onClick={() => navigate(`/properties/${prop.id}`)}
              >
                <div className="property-card-icon" aria-hidden="true">⌂</div>
                <div className="property-card-body">
                  <h4 className="property-card-name">{prop.name}</h4>
                  <p className="property-card-address">{prop.type}</p>
                  <p className="property-card-meta">
                    {prop.zone_count} zone{prop.zone_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className="property-card-arrow" aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  accent: "blue" | "violet" | "emerald" | "amber";
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div className={`stat-card stat-card--${accent}`} aria-label={`${label}: ${value}`}>
      <span className="stat-icon" aria-hidden="true">{icon}</span>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  );
}
