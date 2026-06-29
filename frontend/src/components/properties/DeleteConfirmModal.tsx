/**
 * src/components/properties/DeleteConfirmModal.tsx
 *
 * Simple confirmation dialog before deleting a property.
 */

import { useEffect, useRef } from "react";
import { useDeleteProperty } from "@/hooks/usePropertiesQuery";
import type { Property } from "@/types/property";

interface Props {
  open: boolean;
  onClose: () => void;
  property: Property | null;
}

export function DeleteConfirmModal({ open, onClose, property }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deleteMutation = useDeleteProperty();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal();
      deleteMutation.reset();
    } else {
      el.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose();
  }

  async function handleConfirm() {
    if (!property) return;
    try {
      await deleteMutation.mutateAsync(property.id);
      onClose();
    } catch {
      /* error shown inline */
    }
  }

  return (
    <dialog
      ref={dialogRef}
      id="delete-confirm-dialog"
      className="property-modal property-modal--sm"
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      <div className="property-modal-inner">
        <div className="property-modal-header">
          <h2 className="property-modal-title">Delete Property</h2>
          <button
            id="delete-modal-close-btn"
            className="modal-close-btn"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="property-modal-body">
          {deleteMutation.error && (
            <div className="alert alert--error" role="alert">
              Failed to delete property. Please try again.
            </div>
          )}
          <div className="delete-confirm-body">
            <span className="delete-icon" aria-hidden="true">⚠️</span>
            <p className="delete-confirm-text">
              Are you sure you want to delete{" "}
              <strong className="delete-property-name">
                {property?.name}
              </strong>
              ? This will also remove all associated zones and cannot be undone.
            </p>
          </div>
        </div>

        <div className="property-modal-footer">
          <button
            id="delete-cancel-btn"
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </button>
          <button
            id="delete-confirm-btn"
            type="button"
            className="btn btn-danger"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete Property"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
