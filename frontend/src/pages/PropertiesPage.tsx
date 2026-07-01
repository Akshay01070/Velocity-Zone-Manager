/**
 * src/pages/PropertiesPage.tsx — Full Property Management UI.
 *
 * Features:
 *  - List all user properties with pagination
 *  - Search by name (debounced)
 *  - Filter by property type
 *  - Create property (modal form)
 *  - Edit property (modal form)
 *  - Delete property (confirmation modal)
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePropertiesList } from "@/hooks/usePropertiesQuery";
import { PropertyFormModal } from "@/components/properties/PropertyFormModal";
import { DeleteConfirmModal } from "@/components/properties/DeleteConfirmModal";
import { Spinner } from "@/components/ui/Spinner";
import { PROPERTY_TYPES } from "@/types/property";
import type { Property, PropertyType } from "@/types/property";

const TYPE_ICONS: Record<string, string> = {
  "Golf Course": "⛳",
  Airport: "✈️",
  "Corporate Campus": "🏢",
  Other: "📍",
};

const TYPE_COLORS: Record<string, string> = {
  "Golf Course": "prop-type--golf",
  Airport: "prop-type--airport",
  "Corporate Campus": "prop-type--corporate",
  Other: "prop-type--other",
};

export function PropertiesPage() {
  /* ── Search & filter state ─────────────────────────────────────────────── */
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<PropertyType | "">("");
  const [page, setPage] = useState(1);

  /* Debounce search by 350ms */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  /* Reset page when filter changes */
  useEffect(() => setPage(1), [typeFilter]);

  /* ── Data fetching ─────────────────────────────────────────────────────── */
  const { data, isLoading, isError, isFetching } = usePropertiesList({
    search: debouncedSearch || undefined,
    type: typeFilter || undefined,
    page,
    limit: 12,
  });

  const properties = data?.properties ?? [];
  const pagination = data?.pagination;

  /* ── Modal state ────────────────────────────────────────────────────────── */
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Property | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const openCreate = useCallback(() => {
    setEditTarget(undefined);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((p: Property) => {
    setEditTarget(p);
    setFormOpen(true);
  }, []);

  const openDelete = useCallback((p: Property) => {
    setDeleteTarget(p);
    setDeleteOpen(true);
  }, []);

  /* Auto-open create modal when navigated here with state.openCreate */
  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      openCreate();
      // Clear the navigation state so back/forward doesn't re-trigger it
      window.history.replaceState({}, "");
    }
  // Only run once on mount — location.state is read once intentionally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openViewZones = useCallback((p: Property) => {
    navigate(`/properties/${p.id}/zones`);
  }, [navigate]);

  return (
    <div className="properties-page">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="properties-header">
        <div>
          <h2 className="properties-title">Properties</h2>
          <p className="properties-subtitle">
            Manage your properties and their zones.
          </p>
        </div>
        <button
          id="create-property-btn"
          className="btn btn-primary"
          onClick={openCreate}
        >
          <span aria-hidden="true">+</span> New Property
        </button>
      </div>

      {/* ── Search & filter bar ────────────────────────────────────────── */}
      <div className="properties-toolbar">
        <div className="search-wrapper">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            id="property-search"
            type="search"
            className="search-input"
            placeholder="Search by name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search properties by name"
          />
          {isFetching && (
            <span className="search-spinner">
              <Spinner size="sm" />
            </span>
          )}
        </div>

        <select
          id="property-type-filter"
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as PropertyType | "")}
          aria-label="Filter by property type"
        >
          <option value="">All Types</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="properties-loading">
          <Spinner size="lg" />
          <p className="loading-text">Loading properties…</p>
        </div>
      ) : isError ? (
        <div className="alert alert--error" role="alert">
          Failed to load properties. Please refresh the page.
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          hasFilters={!!(debouncedSearch || typeFilter)}
          onClear={() => {
            setSearchInput("");
            setTypeFilter("");
          }}
          onCreate={openCreate}
        />
      ) : (
        <>
          {/* Results count */}
          {pagination && (
            <p className="results-count">
              {pagination.total} propert{pagination.total === 1 ? "y" : "ies"}
              {debouncedSearch && ` matching "${debouncedSearch}"`}
            </p>
          )}

          {/* Grid */}
          <div className="properties-grid">
            {properties.map((prop) => (
              <PropertyCard
                key={prop.id}
                property={prop}
                onEdit={openEdit}
                onDelete={openDelete}
                onViewZones={openViewZones}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <Pagination
              page={page}
              pages={pagination.pages}
              onPage={setPage}
            />
          )}
        </>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <PropertyFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        property={editTarget}
      />
      <DeleteConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        property={deleteTarget}
      />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface PropertyCardProps {
  property: Property;
  onEdit: (p: Property) => void;
  onDelete: (p: Property) => void;
  onViewZones: (p: Property) => void;
}

function PropertyCard({ property, onEdit, onDelete, onViewZones }: PropertyCardProps) {
  return (
    <div
      id={`property-card-${property.id}`}
      className="prop-card"
      role="article"
    >
      <div className="prop-card-top">
        <div className={`prop-type-badge ${TYPE_COLORS[property.type] ?? "prop-type--other"}`}>
          <span aria-hidden="true">{TYPE_ICONS[property.type] ?? "📍"}</span>
          {property.type}
        </div>
        <div className="prop-card-actions">
          <button
            id={`zones-btn-${property.id}`}
            className="prop-action-btn prop-action-btn--zones"
            onClick={() => onViewZones(property)}
            aria-label={`View zones for ${property.name}`}
            title="View Zones"
          >
            🗺️
          </button>
          <button
            id={`edit-btn-${property.id}`}
            className="prop-action-btn prop-action-btn--edit"
            onClick={() => onEdit(property)}
            aria-label={`Edit ${property.name}`}
            title="Edit"
          >
            ✏️
          </button>
          <button
            id={`delete-btn-${property.id}`}
            className="prop-action-btn prop-action-btn--delete"
            onClick={() => onDelete(property)}
            aria-label={`Delete ${property.name}`}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="prop-card-body">
        <h3 className="prop-card-name" title={property.name}>
          {property.name}
        </h3>

        <div className="prop-card-meta-row">
          {property.total_acreage != null && (
            <span className="prop-meta-pill">
              📐 {property.total_acreage.toLocaleString()} ac
            </span>
          )}
          <span className="prop-meta-pill">
            ⬡ {property.zone_count} zone{property.zone_count !== 1 ? "s" : ""}
          </span>
        </div>

        {property.notes && (
          <p className="prop-card-notes" title={property.notes}>
            {property.notes}
          </p>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  hasFilters: boolean;
  onClear: () => void;
  onCreate: () => void;
}

function EmptyState({ hasFilters, onClear, onCreate }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        {hasFilters ? "🔎" : "⌂"}
      </span>
      <p className="empty-text">
        {hasFilters
          ? "No properties match your search."
          : "You haven't added any properties yet."}
      </p>
      {hasFilters ? (
        <button
          id="clear-filters-btn"
          className="btn btn-ghost"
          onClick={onClear}
        >
          Clear filters
        </button>
      ) : (
        <button
          id="empty-create-property-btn"
          className="btn btn-primary"
          onClick={onCreate}
        >
          Create your first property
        </button>
      )}
    </div>
  );
}

interface PaginationProps {
  page: number;
  pages: number;
  onPage: (p: number) => void;
}

function Pagination({ page, pages, onPage }: PaginationProps) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        id="page-prev-btn"
        className="btn btn-ghost btn-sm"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        ← Prev
      </button>
      <span className="page-indicator">
        Page {page} of {pages}
      </span>
      <button
        id="page-next-btn"
        className="btn btn-ghost btn-sm"
        onClick={() => onPage(page + 1)}
        disabled={page >= pages}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}
