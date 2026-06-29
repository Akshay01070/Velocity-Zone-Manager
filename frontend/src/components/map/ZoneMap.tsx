/**
 * src/components/map/ZoneMap.tsx
 *
 * Full zone-management map component wired to the backend.
 *
 * Features:
 *  - Loads zones from API via useZonesList
 *  - Renders all zone polygons on the OL map
 *  - Auto-zooms to zones on first load (falls back to India)
 *  - Zone sidebar list — click to select/highlight on map
 *  - Toolbar: Draw · Edit · Save · Delete
 *  - ZoneFormModal for create and edit-metadata flows
 *  - Delete confirmation inline
 */

import { useState, useEffect, useCallback, useRef } from "react";

import { useZoneMap, NEW_ZONE_ID } from "@/map/useZoneMap";
import {
  useZonesList,
  useCreateZone,
  useUpdateZone,
  useDeleteZone,
  useImportZones,
  useExportZones,
} from "@/hooks/useZonesQuery";
import { ZoneFormModal } from "@/components/zones/ZoneFormModal";
import { ZoneSidebar } from "@/components/zones/ZoneSidebar";
import { GeoJSONImportModal } from "@/components/zones/GeoJSONImportModal";
import { Spinner } from "@/components/ui/Spinner";
import type { ZoneType, ZoneStatus, GeoJSONGeometry, ZoneFeatureCollection } from "@/types/zones";

interface ZoneMapProps {
  propertyId: string;
  propertyName?: string;
}

export function ZoneMap({ propertyId, propertyName }: ZoneMapProps) {
  /* ── API data ──────────────────────────────────────────────────────────── */
  const { data: zones = [], isLoading, isError, refetch } = useZonesList(propertyId);
  const createMutation = useCreateZone(propertyId);
  const updateMutation = useUpdateZone(propertyId);
  const deleteMutation = useDeleteZone(propertyId);
  const importMutation = useImportZones(propertyId);
  const exportMutation = useExportZones(propertyId, propertyName);

  /* ── Map hook ──────────────────────────────────────────────────────────── */
  const [pendingGeometry, setPendingGeometry] = useState<GeoJSONGeometry | null>(null);

  const {
    mapRef,
    mode,
    setMode,
    selectedZoneId,
    setSelectedZoneId,
    loadZones,
    zoomToZones,
    zoomToZone,
    getZoneGeometry,
    cancelDraw,
    hasNewPolygon,
  } = useZoneMap({
    onNewPolygonDrawn: (geom) => {
      setPendingGeometry(geom);
      setCreateModalOpen(true);
    },
  });

  /* ── Modal state ───────────────────────────────────────────────────────── */
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editMetaModalOpen, setEditMetaModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  /* ── Selected zone object ──────────────────────────────────────────────── */
  const selectedZone = zones.find((z) => z.id === selectedZoneId) ?? null;

  /* ── Load zones into map whenever API data changes ─────────────────────── */
  const zonesLoadedRef = useRef(false);

  useEffect(() => {
    if (zones.length >= 0) {
      loadZones(zones);
      if (!zonesLoadedRef.current) {
        // First load — zoom to fit
        zonesLoadedRef.current = true;
        // Small delay to ensure map is rendered before fitting
        setTimeout(() => zoomToZones(), 150);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones]);

  /* ── Handlers ──────────────────────────────────────────────────────────── */

  /** Called from ZoneFormModal when creating a new zone */
  const handleCreate = useCallback(
    async (meta: { name: string; type: ZoneType; status: ZoneStatus; mower_count: number }) => {
      if (!pendingGeometry) return;
      setMutationError(null);
      try {
        await createMutation.mutateAsync({
          ...meta,
          geometry: pendingGeometry,
        });
        setPendingGeometry(null);
        setCreateModalOpen(false);
        cancelDraw();
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message ?? "Failed to create zone.";
        setMutationError(typeof msg === "object" ? JSON.stringify(msg) : msg);
      }
    },
    [pendingGeometry, createMutation, cancelDraw]
  );

  /** Called when user cancels the create modal (abandon polygon) */
  const handleCancelCreate = useCallback(() => {
    setCreateModalOpen(false);
    setPendingGeometry(null);
    cancelDraw();
  }, [cancelDraw]);

  /** Save geometry edits for the selected zone */
  const handleSaveGeometry = useCallback(async () => {
    if (!selectedZoneId || selectedZoneId === NEW_ZONE_ID) return;
    const geom = getZoneGeometry(selectedZoneId);
    if (!geom) return;
    setMutationError(null);
    try {
      await updateMutation.mutateAsync({
        zoneId: selectedZoneId,
        body: { geometry: geom },
      });
      setMode("idle");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Failed to save zone.";
      setMutationError(typeof msg === "object" ? JSON.stringify(msg) : msg);
    }
  }, [selectedZoneId, getZoneGeometry, updateMutation, setMode]);

  /** Save metadata (name/type/status/mower_count) edits */
  const handleSaveMeta = useCallback(
    async (meta: { name: string; type: ZoneType; status: ZoneStatus; mower_count: number }) => {
      if (!selectedZoneId) return;
      setMutationError(null);
      try {
        await updateMutation.mutateAsync({
          zoneId: selectedZoneId,
          body: meta,
        });
        setEditMetaModalOpen(false);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { error?: { message?: string } } } })
            ?.response?.data?.error?.message ?? "Failed to update zone.";
        setMutationError(typeof msg === "object" ? JSON.stringify(msg) : msg);
      }
    },
    [selectedZoneId, updateMutation]
  );

  /** Delete the selected zone */
  const handleDelete = useCallback(async () => {
    if (!selectedZoneId) return;
    setMutationError(null);
    try {
      await deleteMutation.mutateAsync(selectedZoneId);
      setSelectedZoneId(null);
      setDeleteConfirmOpen(false);
      setMode("idle");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Failed to delete zone.";
      setMutationError(typeof msg === "object" ? JSON.stringify(msg) : msg);
    }
  }, [selectedZoneId, deleteMutation, setSelectedZoneId, setMode]);

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    importMutation.isPending ||
    exportMutation.isPending;

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="zone-map-page">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="zone-map-header">
        <div>
          <h2 className="properties-title">
            {propertyName ? `${propertyName} — Zones` : "Zone Manager"}
          </h2>
          <p className="properties-subtitle">
            {isLoading
              ? "Loading zones…"
              : `${zones.length} zone${zones.length !== 1 ? "s" : ""} · Click a polygon to select`}
          </p>
        </div>
        <div className="zone-map-header-actions">
          {/* Export */}
          <button
            id="zone-export-btn"
            className="btn btn-ghost btn-sm"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending || zones.length === 0}
            title={zones.length === 0 ? "No zones to export" : "Download zones as GeoJSON"}
          >
            {exportMutation.isPending ? <Spinner size="sm" /> : "📤"} Export
          </button>
          {/* Import */}
          <button
            id="zone-import-btn"
            className="btn btn-ghost btn-sm"
            onClick={() => setImportModalOpen(true)}
            title="Import zones from a GeoJSON file"
          >
            📥 Import
          </button>
          <button
            id="zone-zoom-btn"
            className="btn btn-ghost btn-sm"
            onClick={zoomToZones}
            title="Zoom to fit all zones"
          >
            🎯 Zoom to Fit
          </button>
          <button
            id="zone-refresh-btn"
            className="btn btn-ghost btn-sm"
            onClick={() => refetch()}
            title="Reload zones from API"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────── */}
      {(isError || mutationError) && (
        <div className="alert alert--error" role="alert">
          {isError ? "Failed to load zones. " : ""}
          {mutationError}
          {mutationError && (
            <button
              className="alert-dismiss"
              onClick={() => setMutationError(null)}
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      )}


      {/* ── Main layout: sidebar + map ─────────────────────────────────── */}
      <div className="zone-map-layout">
        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <ZoneSidebar
          zones={zones}
          isLoading={isLoading}
          selectedZoneId={selectedZoneId}
          onSelectZone={(id) => {
            setSelectedZoneId(id);
            setMode("idle");
            zoomToZone(id);
          }}
        />


        {/* ── Map area ────────────────────────────────────────────────── */}
        <div className="zone-map-area">
          {/* ── Toolbar ──────────────────────────────────────────────── */}
          <div className="zone-map-toolbar" role="toolbar" aria-label="Zone tools">
            {/* Draw */}
            <button
              id="zone-draw-btn"
              type="button"
              className={`map-tool-btn ${mode === "drawing" ? "map-tool-btn--active" : ""}`}
              onClick={() => setMode(mode === "drawing" ? "idle" : "drawing")}
              title={mode === "drawing" ? "Cancel drawing" : "Draw new zone polygon"}
              aria-pressed={mode === "drawing"}
              disabled={isMutating}
            >
              <span className="map-tool-icon" aria-hidden="true">✏️</span>
              <span className="map-tool-label">
                {mode === "drawing" ? "Cancel" : "Draw"}
              </span>
            </button>

            {/* Edit geometry */}
            <button
              id="zone-edit-btn"
              type="button"
              className={`map-tool-btn ${mode === "modifying" ? "map-tool-btn--active" : ""}`}
              onClick={() => setMode(mode === "modifying" ? "idle" : "modifying")}
              title={selectedZone ? "Edit polygon vertices" : "Select a zone first"}
              disabled={!selectedZone || isMutating}
              aria-pressed={mode === "modifying"}
            >
              <span className="map-tool-icon" aria-hidden="true">⬡</span>
              <span className="map-tool-label">
                {mode === "modifying" ? "Done" : "Edit"}
              </span>
            </button>

            {/* Save geometry */}
            {mode === "modifying" && (
              <button
                id="zone-save-btn"
                type="button"
                className="map-tool-btn map-tool-btn--success"
                onClick={handleSaveGeometry}
                disabled={isMutating}
                title="Save polygon edits"
              >
                <span className="map-tool-icon" aria-hidden="true">💾</span>
                <span className="map-tool-label">
                  {updateMutation.isPending ? "Saving…" : "Save"}
                </span>
              </button>
            )}

            {/* Edit metadata */}
            {selectedZone && mode !== "drawing" && mode !== "modifying" && (
              <button
                id="zone-meta-btn"
                type="button"
                className="map-tool-btn"
                onClick={() => setEditMetaModalOpen(true)}
                disabled={isMutating}
                title="Edit zone name / type"
              >
                <span className="map-tool-icon" aria-hidden="true">📝</span>
                <span className="map-tool-label">Info</span>
              </button>
            )}

            {/* Delete */}
            {selectedZone && mode !== "drawing" && mode !== "modifying" && (
              <button
                id="zone-delete-btn"
                type="button"
                className="map-tool-btn map-tool-btn--danger"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={isMutating}
                title="Delete selected zone"
              >
                <span className="map-tool-icon" aria-hidden="true">🗑️</span>
                <span className="map-tool-label">Delete</span>
              </button>
            )}

            {/* Status chip */}
            <div className="map-status-chip" aria-live="polite">
              {mode === "drawing" && "Click to place vertices · Double-click to close"}
              {mode === "modifying" && `Editing: ${selectedZone?.name ?? "zone"} · Save when done`}
              {mode === "idle" && !selectedZone && !hasNewPolygon && "Click a polygon to select, or Draw a new zone"}
              {mode === "idle" && selectedZone && `Selected: ${selectedZone.name}`}
              {isMutating && <Spinner size="sm" />}
            </div>
          </div>

          {/* ── Delete confirmation strip ─────────────────────────────── */}
          {deleteConfirmOpen && selectedZone && (
            <div className="zone-delete-confirm" role="alert">
              <span className="zone-delete-confirm-text">
                ⚠️ Delete <strong>{selectedZone.name}</strong>? This cannot be undone.
              </span>
              <div className="zone-delete-confirm-actions">
                <button
                  id="zone-delete-cancel"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  id="zone-delete-confirm"
                  className="btn btn-danger btn-sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting…" : "Delete Zone"}
                </button>
              </div>
            </div>
          )}

          {/* ── OL Map canvas ─────────────────────────────────────────── */}
          <div ref={mapRef} className="ol-map zone-ol-map" />
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}
      {/* Create new zone modal (opens after polygon is drawn) */}
      <ZoneFormModal
        open={createModalOpen}
        onClose={handleCancelCreate}
        onSave={handleCreate}
        isSaving={createMutation.isPending}
      />

      {/* Edit existing zone metadata */}
      <ZoneFormModal
        open={editMetaModalOpen}
        onClose={() => setEditMetaModalOpen(false)}
        zone={selectedZone}
        onSave={handleSaveMeta}
        isSaving={updateMutation.isPending}
      />

      {/* GeoJSON import modal */}
      <GeoJSONImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={async (fc: ZoneFeatureCollection) => {
          return importMutation.mutateAsync(fc);
        }}
      />
    </div>
  );
}

