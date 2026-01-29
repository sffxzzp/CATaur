"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export function Modal({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] grid min-h-screen place-items-center bg-slate-950/45 px-4 py-10 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 240 }}
            className={cn(
              "pointer-events-auto w-full max-w-md rounded-3xl border border-white/60 bg-white/95 p-6 shadow-[0_32px_90px_-48px_rgba(12,24,55,0.8)] ring-1 ring-slate-200/70 backdrop-blur",
              className,
            )}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
