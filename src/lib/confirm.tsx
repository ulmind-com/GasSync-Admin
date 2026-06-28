import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

/**
 * In-app confirmation rendered as a toast card (no native window.confirm).
 * Resolves to true if confirmed, false otherwise.
 */
export function confirmToast(options: ConfirmOptions): Promise<boolean> {
  const { title = 'Are you sure?', message, confirmLabel = 'Delete', cancelLabel = 'Cancel', danger = true } = options;

  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div className={`confirm-toast glass-panel ${t.visible ? 'confirm-in' : 'confirm-out'}`}>
          <div className="confirm-toast-head">
            <span className={`confirm-icon ${danger ? 'danger' : ''}`}>
              <AlertTriangle size={18} />
            </span>
            <div>
              <div className="confirm-title">{title}</div>
              <div className="confirm-msg">{message}</div>
            </div>
          </div>
          <div className="confirm-actions">
            <button
              className="btn btn-outline"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
            >
              {cancelLabel}
            </button>
            <button
              className={danger ? 'btn btn-danger' : 'btn btn-primary'}
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: 'top-center' }
    );
  });
}
