/**
 * src/components/properties/PropertyFormModal.tsx
 *
 * Modal dialog for creating or updating a property.
 * Controlled from the parent via `open` / `onClose`.
 */

import { useEffect, useRef, useState } from "react";
import { useCreateProperty, useUpdateProperty } from "@/hooks/usePropertiesQuery";
import { PROPERTY_TYPES } from "@/types/property";
import type { Property, PropertyType } from "@/types/property";

interface Props {
  open: boolean;
  onClose: () => void;
  /** When provided, the form is in "edit" mode. */
  property?: Property;
}

interface FormState {
  name: string;
  type: PropertyType;
  total_acreage: string;
  notes: string;
}

const EMPTY: FormState = {
  name: "",
  type: "Golf Course",
  total_acreage: "",
  notes: "",
};

export function PropertyFormModal({ open, onClose, property }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isEdit = !!property;

  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  /* Sync form state when modal opens / property changes */
  useEffect(() => {
    if (open) {
      setServerError(null);
      setFieldErrors({});
      if (property) {
        setForm({
          name: property.name,
          type: property.type,
          total_acreage: property.total_acreage != null ? String(property.total_acreage) : "",
          notes: property.notes ?? "",
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, property]);

  /* Native dialog open / close */
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
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
    if (!form.type) errs.type = "Type is required.";
    if (form.total_acreage && isNaN(Number(form.total_acreage))) {
      errs.total_acreage = "Must be a number.";
    }
    if (form.total_acreage && Number(form.total_acreage) < 0) {
      errs.total_acreage = "Must be non-negative.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setServerError(null);

    const payload = {
      name: form.name.trim(),
      type: form.type,
      total_acreage: form.total_acreage ? Number(form.total_acreage) : null,
      notes: form.notes.trim() || null,
    };

    try {
      if (isEdit && property) {
        await updateMutation.mutateAsync({ id: property.id, body: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Something went wrong.";
      setServerError(typeof msg === "object" ? JSON.stringify(msg) : msg);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      id="property-form-dialog"
      className="property-modal"
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      <div className="property-modal-inner">
        {/* Header */}
        <div className="property-modal-header">
          <h2 className="property-modal-title">
            {isEdit ? "Edit Property" : "New Property"}
          </h2>
          <button
            id="modal-close-btn"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form id="property-form" onSubmit={handleSubmit} noValidate>
          <div className="property-modal-body">
            {serverError && (
              <div className="alert alert--error" role="alert">
                {serverError}
              </div>
            )}

            {/* Name */}
            <div className="input-group">
              <label htmlFor="prop-name" className="input-label">
                Property Name <span className="text-danger">*</span>
              </label>
              <input
                id="prop-name"
                type="text"
                className={`input-field${fieldErrors.name ? " input-field--error" : ""}`}
                placeholder="e.g. Lakeside Golf Club"
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
              <label htmlFor="prop-type" className="input-label">
                Property Type <span className="text-danger">*</span>
              </label>
              <select
                id="prop-type"
                className={`input-field${fieldErrors.type ? " input-field--error" : ""}`}
                value={form.type}
                onChange={(e) => set("type", e.target.value as PropertyType)}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {fieldErrors.type && (
                <span className="input-error">{fieldErrors.type}</span>
              )}
            </div>

            {/* Total Acreage */}
            <div className="input-group">
              <label htmlFor="prop-acreage" className="input-label">
                Total Acreage
              </label>
              <input
                id="prop-acreage"
                type="number"
                min="0"
                step="0.01"
                className={`input-field${fieldErrors.total_acreage ? " input-field--error" : ""}`}
                placeholder="e.g. 125.5"
                value={form.total_acreage}
                onChange={(e) => set("total_acreage", e.target.value)}
              />
              {fieldErrors.total_acreage && (
                <span className="input-error">{fieldErrors.total_acreage}</span>
              )}
            </div>

            {/* Notes */}
            <div className="input-group">
              <label htmlFor="prop-notes" className="input-label">
                Notes
              </label>
              <textarea
                id="prop-notes"
                className="input-field input-textarea"
                placeholder="Any additional details…"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="property-modal-footer">
            <button
              id="modal-cancel-btn"
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              id="modal-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                ? "Save Changes"
                : "Create Property"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
