/**
 * src/components/zones/ZoneSidebar.tsx
 *
 * A rich sidebar panel that appears alongside the Zone Map.
 *
 * Layout
 * ───────
 *  ┌─────────────────────────────┐
 *  │  Summary Card               │  Total Zones · Total Area · Mowers · Understaffed
 *  ├─────────────────────────────┤
 *  │  Search / filter bar        │
 *  ├─────────────────────────────┤
 *  │  Scrollable zone rows       │  Name · Area · Mowers · Status · Understaffed badge
 *  └─────────────────────────────┘
 *
 * Props
 * ──────
 *  zones           – the full list from the API
 *  isLoading       – show skeleton state
 *  selectedZoneId  – the currently selected zone id
 *  onSelectZone    – called when user clicks a zone row (also triggers zoom)
 */

import { useState, useMemo } from "react";
import { Spinner } from "@/components/ui/Spinner";
import type { Zone, ZoneType } from "@/types/zones";

// ── helpers ──────────────────────────────────────────────────────────────────

const ZONE_TYPE_COLORS: Record<ZoneType, string> = {
  Fairway:   "zone-type--fairway",
  Rough:     "zone-type--rough",
  Perimeter: "zone-type--perimeter",
  Exclusion: "zone-type--exclusion",
};

function formatArea(area?: number): string {
  if (area == null || area === 0) return "—";
  if (area >= 10_000) return `${(area / 10_000).toFixed(2)} ha`;
  return `${Math.round(area).toLocaleString()} m²`;
}

// ── Summary card ──────────────────────────────────────────────────────────────

interface SummaryCardProps {
  totalZones: number;
  totalArea: number;
  totalMowers: number;
  understaffedCount: number;
}

function SummaryCard({ totalZones, totalArea, totalMowers, understaffedCount }: SummaryCardProps) {
  return (
    <div className="zsb-summary">
      <div className="zsb-summary-grid">
        {/* Total Zones */}
        <div className="zsb-stat zsb-stat--blue">
          <span className="zsb-stat-icon" aria-hidden="true">⬡</span>
          <div className="zsb-stat-body">
            <span className="zsb-stat-value">{totalZones}</span>
            <span className="zsb-stat-label">Zones</span>
          </div>
        </div>

        {/* Total Area */}
        <div className="zsb-stat zsb-stat--violet">
          <span className="zsb-stat-icon" aria-hidden="true">📐</span>
          <div className="zsb-stat-body">
            <span className="zsb-stat-value zsb-stat-value--sm">{formatArea(totalArea)}</span>
            <span className="zsb-stat-label">Total Area</span>
          </div>
        </div>

        {/* Total Mowers */}
        <div className="zsb-stat zsb-stat--emerald">
          <span className="zsb-stat-icon" aria-hidden="true">🚜</span>
          <div className="zsb-stat-body">
            <span className="zsb-stat-value">{totalMowers}</span>
            <span className="zsb-stat-label">Mowers</span>
          </div>
        </div>

        {/* Understaffed */}
        <div className={`zsb-stat ${understaffedCount > 0 ? "zsb-stat--amber" : "zsb-stat--neutral"}`}>
          <span className="zsb-stat-icon" aria-hidden="true">⚠️</span>
          <div className="zsb-stat-body">
            <span className="zsb-stat-value">{understaffedCount}</span>
            <span className="zsb-stat-label">Understaffed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Zone row ──────────────────────────────────────────────────────────────────

interface ZoneRowProps {
  zone: Zone;
  isSelected: boolean;
  onSelect: () => void;
}

function ZoneRow({ zone, isSelected, onSelect }: ZoneRowProps) {
  const area = zone.geometry?.area;
  const understaffed = zone.understaffed ?? false;

  return (
    <li
      id={`zsb-zone-${zone.id}`}
      className={[
        "zsb-row",
        isSelected   ? "zsb-row--selected"    : "",
        understaffed ? "zsb-row--understaffed" : "",
      ].filter(Boolean).join(" ")}
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
    >
      {/* Left accent bar for understaffed */}
      {understaffed && <span className="zsb-row-warn-bar" aria-hidden="true" />}

      {/* Top line: type badge + status dot */}
      <div className="zsb-row-top">
        <span className={`zone-type-badge ${ZONE_TYPE_COLORS[zone.type]}`}>
          {zone.type}
        </span>
        <div className="zsb-row-top-right">
          {understaffed && (
            <span className="zsb-understaffed-badge" title="Understaffed — needs more mowers">
              ⚠ Understaffed
            </span>
          )}
          <span
            className={`zone-status-dot ${zone.status === "Active" ? "zone-status-dot--active" : "zone-status-dot--inactive"}`}
            title={zone.status}
          />
        </div>
      </div>

      {/* Zone name */}
      <span className="zsb-row-name" title={zone.name}>{zone.name}</span>

      {/* Meta row: area, mowers */}
      <div className="zsb-row-meta">
        <span className="zsb-row-meta-item" title="Area">
          <span aria-hidden="true">📐</span> {formatArea(area)}
        </span>
        <span className="zsb-row-meta-item" title="Mower count">
          <span aria-hidden="true">🚜</span> {zone.mower_count} mower{zone.mower_count !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Zoom hint on hover */}
      <span className="zsb-row-zoom-hint" aria-hidden="true">Click to zoom ↗</span>
    </li>
  );
}

// ── Main ZoneSidebar ──────────────────────────────────────────────────────────

export interface ZoneSidebarProps {
  zones: Zone[];
  isLoading: boolean;
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
}

export function ZoneSidebar({
  zones,
  isLoading,
  selectedZoneId,
  onSelectZone,
}: ZoneSidebarProps) {
  const [search, setSearch] = useState("");
  const [filterUnderstaffed, setFilterUnderstaffed] = useState(false);

  // ── Aggregates ────────────────────────────────────────────────────────────
  const totalZones       = zones.length;
  const totalArea        = useMemo(() => zones.reduce((acc, z) => acc + (z.geometry?.area ?? 0), 0), [zones]);
  const totalMowers      = useMemo(() => zones.reduce((acc, z) => acc + z.mower_count, 0), [zones]);
  const understaffedCount = useMemo(() => zones.filter((z) => z.understaffed).length, [zones]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = zones;
    if (filterUnderstaffed) list = list.filter((z) => z.understaffed);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((z) => z.name.toLowerCase().includes(q) || z.type.toLowerCase().includes(q));
    }
    return list;
  }, [zones, search, filterUnderstaffed]);

  return (
    <aside className="zsb-panel" aria-label="Zone list">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="zsb-header">
        <span className="zsb-header-title">Zones</span>
        <span className="zsb-header-count">{totalZones}</span>
      </div>

      {/* ── Summary card ───────────────────────────────────────────────── */}
      <SummaryCard
        totalZones={totalZones}
        totalArea={totalArea}
        totalMowers={totalMowers}
        understaffedCount={understaffedCount}
      />

      {/* ── Filter bar ─────────────────────────────────────────────────── */}
      <div className="zsb-filter-bar">
        <div className="zsb-search-wrap">
          <span className="zsb-search-icon" aria-hidden="true">🔍</span>
          <input
            id="zsb-search"
            className="zsb-search-input"
            type="search"
            placeholder="Search zones…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search zones"
          />
        </div>
        <button
          id="zsb-understaffed-filter"
          className={`zsb-filter-btn ${filterUnderstaffed ? "zsb-filter-btn--active" : ""}`}
          onClick={() => setFilterUnderstaffed((v) => !v)}
          title="Show understaffed zones only"
          aria-pressed={filterUnderstaffed}
        >
          ⚠️ {understaffedCount > 0 && <span className="zsb-filter-count">{understaffedCount}</span>}
        </button>
      </div>

      {/* ── List ───────────────────────────────────────────────────────── */}
      <div className="zsb-list-wrap">
        {isLoading ? (
          <div className="zsb-loading">
            <Spinner size="sm" />
            <span>Loading zones…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="zsb-empty">
            <span className="zsb-empty-icon" aria-hidden="true">⬡</span>
            <p>{zones.length === 0 ? "No zones yet." : "No results."}</p>
            {zones.length === 0 && (
              <p className="zsb-empty-hint">Use Draw to create one.</p>
            )}
          </div>
        ) : (
          <ul className="zsb-list" role="listbox" aria-label="Zones">
            {filtered.map((zone) => (
              <ZoneRow
                key={zone.id}
                zone={zone}
                isSelected={zone.id === selectedZoneId}
                onSelect={() => onSelectZone(zone.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
