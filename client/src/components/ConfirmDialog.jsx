import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

function ConfirmDialog({ isOpen, title, message, confirmLabel, tone = "danger", onConfirm, onCancel }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
        <div className={`confirm-dialog__icon confirm-dialog__icon--${tone}`}><AlertTriangle size={22} /></div>
        <button type="button" className="icon-button confirm-dialog__close" onClick={onCancel} aria-label="Close"><X size={20} /></button>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-message">{message}</p>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>
          <button type="button" className={tone === "danger" ? "danger-button" : "primary-button"} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
