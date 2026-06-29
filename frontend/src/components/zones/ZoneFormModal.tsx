/**
 * src/components/zones/ZoneFormModal.tsx
 *
 * Modal for entering / editing zone metadata (name, type, status, mower count).
 * Used when:
 *   - Creating a new zone (after drawing a polygon)
 *   - Editing an existing zone's metadata
 *
 * Does NOT handle geometry — geometry is managed by the map.
 */

import { useEffect, useRef, useState } from "react";
import type { Zone, ZoneType, ZoneStatus } from "@/types/zones";

const ZONE_TYPES: ZoneType[] = ["Fairway", "Rough", "Perimeter", "Exclusion"];

const ZONE_TYPE_COLORS: Record<ZoneType, string> = {
  Fairway:   "zone-type--fairway",
  Rough:     "zone-type--rough",
  Perimeter: "zone-type--perimeter",
  Exclusion: "zone-type--exclusion",
};

interface FormState {
  name: string;
  type: ZoneType;
  status: ZoneStatus;
  mower_count: string;
}

const EMPTY: FormState = {
  name: "",
  type: "Fairway",
  status: "Active",
  mower_count: "0",
};

interface Props {
  open: boolean;
  onClose: () => void;
  /** When provided the modal is in "edit metadata" mode. */
  zone?: Zone | null;
  onSave: (data: {
    name: string;
    type: ZoneType;
    status: ZoneStatus;
    mower_count: number;
  }) => void;
  isSaving?: boolean;
}

export function ZoneFormModal({ open, onClose, zone, onSave, isSaving }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isEdit    = !!zone;

  const [form, setForm]         = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  /* Sync form when modal opens or target zone changes */
  useEffect(() => {
    if (open) {
      setFieldErrors({});
      if (zone) {
        setForm({
          name:        zone.name,
          type:        zone.type,
          status:      zone.status,
          mower_count: String(zone.mower_count),
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, zone]);

  /* Open / close native dialog */
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) el.showModal(); else el.close();
  }, [open]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose();
  }

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    const mc = Number(form.mower_count);
    if (isNaN(mc) || mc < 0 || !Number.isInteger(mc)) {
      errs.mower_count = "Must be a non-negative integer.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name:        form.name.trim(),
      type:        form.type,
      status:      form.status,
      mower_count: Number(form.mower_count),
    });
  }

  return (
    <dialog
      ref={dialogRef}
      id="zone-form-dialog"
      className="property-modal property-modal--sm"
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      <div className="property-modal-inner">
        {/* Header */}
        <div className="property-modal-header">
          <h2 className="property-modal-title">
            {isEdit ? "Edit Zone" : "New Zone"}
          </h2>
          <button
            id="zone-modal-close-btn"
            className="modal-close-btn"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form id="zone-form" onSubmit={handleSubmit} noValidate>
          <div className="property-modal-body">
            {!isEdit && (
              <div className="zone-form-hint">
                <span className="zone-form-hint-icon">✅</span>
                Polygon drawn. Give this zone a name to save it.
              </div>
            )}

            {/* Name */}
            <div className="input-group">
              <label htmlFor="zone-name" className="input-label">
                Zone Name <span className="text-danger">*</span>
              </label>
              <input
                id="zone-name"
                type="text"
                className={`input-field${fieldErrors.name ? " input-field--error" : ""}`}
                placeholder="e.g. Hole 1 Fairway"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                autoFocus
                maxLength={255}
              />
              {fieldErrors.name && (
                <span className="input-error">{fieldErrors.name}</span>
              )}
            </div>

            {/* Type */}
            <div className="input-group">
              <label className="input-label">Zone Type</label>
              <div className="zone-type-pills">
                {ZONE_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`zone-type-pill ${ZONE_TYPE_COLORS[t]} ${form.type === t ? "zone-type-pill--active" : ""}`}
                    onClick={() => set("type", t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="input-group">
              <label className="input-label">Status</label>
              <div className="zone-status-toggle">
                {(["Active", "Inactive"] as ZoneStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`zone-status-btn ${form.status === s ? "zone-status-btn--active" : ""}`}
                    onClick={() => set("status", s)}
                  >
                    {s === "Active" ? "🟢" : "🔴"} {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Mower count */}
            <div className="input-group">
              <label htmlFor="zone-mowers" className="input-label">
                Mower Count
              </label>
              <input
                id="zone-mowers"
                type="number"
                min="0"
                step="1"
                className={`input-field${fieldErrors.mower_count ? " input-field--error" : ""}`}
                value={form.mower_count}
                onChange={(e) => set("mower_count", e.target.value)}
              />
              {fieldErrors.mower_count && (
                <span className="input-error">{fieldErrors.mower_count}</span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="property-modal-footer">
            <button
              id="zone-modal-cancel-btn"
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              id="zone-modal-save-btn"
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Save Zone"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
