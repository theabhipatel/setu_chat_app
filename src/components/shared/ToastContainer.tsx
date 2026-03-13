"use client";

import { useToastStore } from "@/stores/useToastStore";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right-5 fade-in duration-300 ${
            t.type === "success"
              ? "bg-success/35 border-success/50 text-success"
              : t.type === "error"
              ? "bg-destructive/35 border-destructive/50 text-destructive"
              : "bg-primary/35 border-primary/50 text-primary"
          }`}
        >
          {t.type === "success" && <CheckCircle2 className="h-5 w-5 shrink-0" />}
          {t.type === "error" && <AlertCircle className="h-5 w-5 shrink-0" />}
          {t.type === "info" && <Info className="h-5 w-5 shrink-0" />}
          <p className="text-sm font-medium flex-1">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            className="opacity-60 hover:opacity-100 transition-opacity shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
