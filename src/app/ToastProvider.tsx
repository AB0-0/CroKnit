import React, { createContext, useContext, useMemo, useState } from "react";

type Toast = {
  id: string;
  message: React.ReactNode;
  duration?: number;
  action?: { label: string; onClick: () => void };
  kind?: "info" | "success" | "error";
};

const ToastContext = createContext<{ addToast: (t: Omit<Toast, "id">) => string; removeToast: (id: string) => void } | null>(null);

export function useToasts() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function addToast(t: Omit<Toast, "id">) {
    const id = Math.random().toString(36).slice(2, 9);
    const toast: Toast = { id, ...t };
    setToasts((s) => [...s, toast]);
    if (t.duration !== 0) {
      const duration = t.duration ?? 3500;
      setTimeout(() => {
        setToasts((s) => s.filter((x) => x.id !== id));
      }, duration);
    }
    return id;
  }

  function removeToast(id: string) {
    setToasts((s) => s.filter((x) => x.id !== id));
  }

  const value = useMemo(() => ({ addToast, removeToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="toasts-root" style={{ position: "fixed", right: 16, top: 72, zIndex: 9999 }}>
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind ?? "info"}`} style={{
            marginBottom: 10,
            background: "rgba(0,0,0,0.6)",
            color: "white",
            padding: "10px 12px",
            borderRadius: 8,
            minWidth: 200,
            boxShadow: "0 6px 18px rgba(0,0,0,0.5)",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}>
            <div style={{ flex: 1 }}>{t.message}</div>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick();
                  removeToast(t.id);
                }}
                className="btn-ctrl"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
