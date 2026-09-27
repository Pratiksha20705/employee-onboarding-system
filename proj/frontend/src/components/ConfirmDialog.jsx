import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  danger = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      maxWidth={400}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? "btn-danger-solid" : "btn-primary"}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", gap: 12 }}>
        {danger && (
          <span style={{ color: "var(--danger-600)", flexShrink: 0 }}>
            <AlertTriangle size={20} />
          </span>
        )}
        <p style={{ fontSize: "var(--fs-sm)", color: "var(--n-700)", lineHeight: 1.5 }}>{message}</p>
      </div>
    </Modal>
  );
}
