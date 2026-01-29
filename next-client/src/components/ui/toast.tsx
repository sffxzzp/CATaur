"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, ShieldAlert, X } from "lucide-react";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type ToastTone = "success" | "info" | "error";

type ToastPayload = {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
};

type Toast = ToastPayload & {
  id: number;
  tone: ToastTone;
};

type ToastContextValue = {
  push: (toast: ToastPayload) => void;
};

const toneStyles: Record<
  ToastTone,
  { iconBg: string; bar: string; text: string; accent: string; icon: typeof CheckCircle2 }
> = {
  success: {
    iconBg: "from-emerald-500 to-teal-500 shadow-[0_15px_30px_-18px_rgba(16,185,129,0.8)]",
    bar: "from-emerald-400/90 to-teal-500/90",
    text: "text-emerald-900",
    accent: "text-emerald-700",
    icon: CheckCircle2,
  },
  info: {
    iconBg: "from-sky-500 to-indigo-500 shadow-[0_15px_30px_-18px_rgba(56,189,248,0.75)]",
    bar: "from-sky-400/90 to-indigo-500/90",
    text: "text-slate-900",
    accent: "text-sky-800",
    icon: Info,
  },
  error: {
    iconBg: "from-rose-500 to-orange-500 shadow-[0_15px_30px_-18px_rgba(239,68,68,0.75)]",
    bar: "from-rose-400/90 to-orange-500/90",
    text: "text-rose-900",
    accent: "text-rose-800",
    icon: ShieldAlert,
  },
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    ({ tone = "info", duration = 3600, ...toast }: ToastPayload) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { ...toast, tone, id }]);
      const timer = setTimeout(() => remove(id), duration);
      timers.current.set(id, timer);
    },
    [remove],
  );

  useEffect(() => {
    return () => timers.current.forEach((timer) => clearTimeout(timer));
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex justify-center px-4">
        <div className="flex w-full max-w-2xl flex-col gap-3">
          <AnimatePresence initial={false}>
            {toasts.map((toast) => {
              const tone = toneStyles[toast.tone];
              const Icon = tone.icon;

              return (
                <motion.div
                  key={toast.id}
                  initial={{ y: -18, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -10, opacity: 0, scale: 0.97 }}
                  transition={{ type: "spring", damping: 20, stiffness: 320 }}
                  className="pointer-events-auto relative overflow-hidden rounded-3xl border border-white/70 bg-white/95 px-5 py-4 shadow-[0_28px_70px_-34px_rgba(12,24,55,0.75)] ring-1 ring-slate-200/70 backdrop-blur"
                >
                  <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${tone.bar}`} />
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tone.iconBg}`}
                    >
                      <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold leading-tight ${tone.text}`}>{toast.title}</p>
                      {toast.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(toast.id)}
                      className="rounded-full bg-slate-100/80 p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                      aria-label="Dismiss notification"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
