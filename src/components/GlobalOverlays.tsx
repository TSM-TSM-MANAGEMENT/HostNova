import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react';
import { useHostNova } from '../context/HostNovaContext';
import { LegalModal } from './LegalModal';

export function GlobalOverlays() {
  const { toasts, dismissToast, confirmDialog, closeConfirm } = useHostNova();
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!confirmDialog || confirming) return;
    setConfirming(true);
    try {
      await confirmDialog.onConfirm();
    } finally {
      setConfirming(false);
      closeConfirm();
    }
  };

  return (
    <>
      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div
          className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)]"
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-xl px-4 py-3 border shadow-xl flex items-start gap-3 text-xs sm:text-sm backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-[#0B1C17]/95 border-emerald-500/40 text-emerald-100'
                  : toast.type === 'error'
                  ? 'bg-[#1F0B12]/95 border-rose-500/40 text-rose-100'
                  : 'bg-[#0D1528]/95 border-blue-500/40 text-blue-100'
              }`}
            >
              {toast.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              {toast.type === 'error' && (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              {toast.type === 'info' && (
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              )}
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-white shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0D1528] border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {confirmDialog.description}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={confirming}
                onClick={closeConfirm}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirming}
                onClick={() => void handleConfirm()}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {confirming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{confirmDialog.confirmLabel}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms / Privacy Modal */}
      <LegalModal />
    </>
  );
}
