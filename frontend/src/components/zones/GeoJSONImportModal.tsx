/**
 * src/components/zones/GeoJSONImportModal.tsx
 *
 * Modal for importing a GeoJSON FeatureCollection file.
 *
 * UX flow
 * ───────
 *  1. User clicks "Import GeoJSON" in the zone map header.
 *  2. Modal opens — drag-and-drop or file-picker area.
 *  3. File is parsed client-side; basic shape validation runs instantly.
 *  4. Preview: feature count, detected zone types.
 *  5. "Upload" button posts to POST /properties/:id/zones/import.
 *  6. Backend validation errors (per-feature) are rendered in a scrollable list.
 *  7. On success: toast-style success banner + modal auto-closes after 1.5 s.
 */

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from "react";
import type {
  ZoneFeatureCollection,
  ImportZonesResponse,
  ImportValidationErrors,
  ImportFeatureError,
} from "@/types/zones";

// ── types ─────────────────────────────────────────────────────────────────────

interface ParseResult {
  ok: true;
  fc: ZoneFeatureCollection;
  featureCount: number;
  types: string[];
}

interface ParseError {
  ok: false;
  message: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function parseFile(text: string): ParseResult | ParseError {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, message: "File is not valid JSON." };
  }

  if (typeof json !== "object" || json === null) {
    return { ok: false, message: "JSON must be an object." };
  }

  const obj = json as Record<string, unknown>;

  if (obj.type !== "FeatureCollection") {
    return {
      ok: false,
      message: `Expected a GeoJSON FeatureCollection, got type="${String(obj.type)}".`,
    };
  }

  if (!Array.isArray(obj.features) || obj.features.length === 0) {
    return { ok: false, message: "FeatureCollection must have at least one feature." };
  }

  const fc = obj as unknown as ZoneFeatureCollection;

  // Collect unique type labels for preview
  const typeSet = new Set<string>();
  for (const f of fc.features) {
    const t = (f as { properties?: { type?: string } }).properties?.type;
    if (t) typeSet.add(t);
  }

  return {
    ok: true,
    fc,
    featureCount: fc.features.length,
    types: [...typeSet],
  };
}

function formatApiErrors(message: unknown): string[] {
  if (typeof message === "string") return [message];
  if (typeof message !== "object" || message === null) return ["Unknown error."];

  const errs: string[] = [];
  const msg = message as ImportValidationErrors;

  if (Array.isArray(msg.features)) {
    for (const fe of msg.features as ImportFeatureError[]) {
      for (const e of fe.errors) {
        errs.push(`Feature #${fe.featureIndex + 1}: ${e}`);
      }
    }
  }

  // Any top-level string errors not under "features"
  for (const [key, val] of Object.entries(msg)) {
    if (key === "features") continue;
    if (typeof val === "string") errs.push(`${key}: ${val}`);
  }

  return errs.length > 0 ? errs : ["Unknown validation error."];
}

// ── Modal component ────────────────────────────────────────────────────────────

export interface GeoJSONImportModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the parsed FeatureCollection once the user clicks Upload */
  onImport: (fc: ZoneFeatureCollection) => Promise<ImportZonesResponse>;
}

type ModalPhase =
  | "idle"        // waiting for file selection
  | "preview"     // file parsed, showing preview
  | "uploading"   // awaiting API response
  | "success"     // 201 received
  | "error";      // validation / network error

export function GeoJSONImportModal({ open, onClose, onImport }: GeoJSONImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<ModalPhase>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [successData, setSuccessData] = useState<ImportZonesResponse | null>(null);

  // ── reset state ────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setPhase("idle");
    setDragOver(false);
    setParseResult(null);
    setClientError(null);
    setApiErrors([]);
    setSuccessData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // ── file handling ──────────────────────────────────────────────────────────
  const processFile = useCallback((file: File) => {
    if (!file.name.match(/\.(geojson|json)$/i)) {
      setClientError("Please select a .geojson or .json file.");
      setPhase("idle");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseFile(text);
      if (result.ok) {
        setParseResult(result);
        setClientError(null);
        setPhase("preview");
      } else {
        setClientError(result.message);
        setParseResult(null);
        setPhase("idle");
      }
    };
    reader.onerror = () => {
      setClientError("Failed to read the file.");
      setPhase("idle");
    };
    reader.readAsText(file);
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  // ── upload ─────────────────────────────────────────────────────────────────
  const isUploadDisabled: boolean =
    !(new Set<ModalPhase>(["preview", "error"]).has(phase)) || phase === "uploading";

  const handleUpload = useCallback(async () => {
    if (!parseResult?.ok) return;
    setPhase("uploading");
    setApiErrors([]);
    try {
      const result = await onImport(parseResult.fc);
      setSuccessData(result);
      setPhase("success");
      // Auto-close after 2 s
      setTimeout(() => {
        reset();
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const axErr = err as {
        response?: { data?: { error?: { message?: unknown } } };
      };
      const rawMsg = axErr?.response?.data?.error?.message;
      setApiErrors(formatApiErrors(rawMsg));
      setPhase("error");
    }
  }, [parseResult, onImport, reset, onClose]);

  if (!open) return null;

  return (
    <div className="gij-backdrop" role="dialog" aria-modal="true" aria-label="Import GeoJSON">
      <div className="gij-panel">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="gij-header">
          <div className="gij-header-left">
            <span className="gij-header-icon" aria-hidden="true">📥</span>
            <span className="gij-header-title">Import GeoJSON</span>
          </div>
          <button
            id="gij-close-btn"
            className="gij-close-btn"
            onClick={handleClose}
            aria-label="Close import modal"
            disabled={phase === "uploading"}
          >
            ✕
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="gij-body">

          {/* Success state */}
          {phase === "success" && successData && (
            <div className="gij-success">
              <span className="gij-success-icon" aria-hidden="true">✅</span>
              <p className="gij-success-msg">
                Successfully imported <strong>{successData.imported}</strong> zone{successData.imported !== 1 ? "s" : ""}!
              </p>
              <p className="gij-success-sub">Closing…</p>
            </div>
          )}

          {/* Drop zone — idle or preview */}
          {phase !== "success" && (
            <>
              <div
                id="gij-dropzone"
                className={[
                  "gij-dropzone",
                  dragOver           ? "gij-dropzone--over"    : "",
                  phase === "preview" ? "gij-dropzone--has-file" : "",
                ].filter(Boolean).join(" ")}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                aria-label="Drop GeoJSON file here or click to browse"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".geojson,.json,application/geo+json,application/json"
                  onChange={handleFileChange}
                  className="gij-file-input"
                  aria-hidden="true"
                  tabIndex={-1}
                />
                {phase === "preview" && parseResult ? (
                  <div className="gij-file-preview">
                    <span className="gij-file-icon" aria-hidden="true">📄</span>
                    <div className="gij-file-info">
                      <span className="gij-file-count">
                        {parseResult.featureCount} feature{parseResult.featureCount !== 1 ? "s" : ""} detected
                      </span>
                      {parseResult.types.length > 0 && (
                        <span className="gij-file-types">
                          Types: {parseResult.types.join(", ")}
                        </span>
                      )}
                    </div>
                    <span className="gij-change-hint">Click to change file</span>
                  </div>
                ) : (
                  <div className="gij-dropzone-inner">
                    <span className="gij-drop-icon" aria-hidden="true">
                      {dragOver ? "📂" : "🗂️"}
                    </span>
                    <p className="gij-drop-primary">
                      {dragOver ? "Drop to upload" : "Drag & drop your GeoJSON file"}
                    </p>
                    <p className="gij-drop-secondary">
                      or <span className="gij-browse-link">browse files</span> — .geojson / .json
                    </p>
                  </div>
                )}
              </div>

              {/* Client-side parse error */}
              {clientError && (
                <div className="gij-error-box" role="alert">
                  <span className="gij-error-icon" aria-hidden="true">⚠️</span>
                  <span>{clientError}</span>
                </div>
              )}

              {/* Backend validation errors */}
              {phase === "error" && apiErrors.length > 0 && (
                <div className="gij-error-section" role="alert">
                  <div className="gij-error-section-header">
                    <span className="gij-error-section-icon" aria-hidden="true">❌</span>
                    <span className="gij-error-section-title">
                      {apiErrors.length} validation error{apiErrors.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <ul className="gij-error-list">
                    {apiErrors.map((e, i) => (
                      <li key={i} className="gij-error-item">
                        <span className="gij-error-bullet" aria-hidden="true">•</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Format guide */}
              <details className="gij-format-guide">
                <summary className="gij-format-summary">Expected GeoJSON format</summary>
                <pre className="gij-format-pre">{`{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lon, lat], ...]]
      },
      "properties": {
        "name": "Hole 1 Fairway",
        "type": "Fairway",
        "status": "Active",
        "mower_count": 2
      }
    }
  ]
}`}</pre>
              </details>
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        {phase !== "success" && (
          <div className="gij-footer">
            <button
              id="gij-cancel-btn"
              className="btn btn-ghost btn-sm"
              onClick={handleClose}
              disabled={phase === "uploading"}
            >
              Cancel
            </button>
            <button
              id="gij-upload-btn"
              className="btn btn-primary btn-sm"
              onClick={handleUpload}
              disabled={isUploadDisabled}
            >
              {phase === "uploading" ? (
                <>
                  <span className="gij-spinner" aria-hidden="true" />
                  Uploading…
                </>
              ) : (
                <>📥 Import {parseResult ? `(${parseResult.featureCount})` : ""}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
