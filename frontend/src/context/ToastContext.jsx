import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X, PhoneCall } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = "info", duration = 4000 }) => {
      const id =
        Date.now().toString() + Math.random().toString(36).substring(2, 6);
      const newToast = { id, title, message, type };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  const toast = {
    success: (title, message) => addToast({ title, message, type: "success" }),
    error: (title, message) => addToast({ title, message, type: "error" }),
    info: (title, message) => addToast({ title, message, type: "info" }),
    call: (title, message) => addToast({ title, message, type: "call" }),
  };

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case "call":
        return (
          <PhoneCall className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
        );
      default:
        return <Info className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case "success":
        return "border-emerald-500/30 bg-slate-900/95";
      case "error":
        return "border-rose-500/40 bg-slate-900/95";
      case "call":
        return "border-amber-500/40 bg-slate-900/95";
      default:
        return "border-indigo-500/30 bg-slate-900/95";
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Overlay Container - Top Right Toaster */}
      <div className="fixed top-5 right-5 z-60 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-2xl animate-fade-in transition-all duration-300 ${getBorderColor(
              t.type,
            )}`}
          >
            <div className="mt-0.5">{getIcon(t.type)}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white">{t.title}</p>
              {t.message && (
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed wrap-break-word">
                  {t.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
