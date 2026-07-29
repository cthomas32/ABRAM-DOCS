"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Blocks the backdrop and Escape while a request is in flight. */
  dismissable?: boolean;
  /** Tailwind max-width for the panel. */
  size?: "sm" | "md";
  /** Extra classes for the panel, e.g. a coloured border for a danger dialog. */
  panelClassName?: string;
  labelledBy?: string;
  children: React.ReactNode;
}

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-md",
};

/**
 * Centred dialog for the admin panel.
 *
 * `AnimatePresence` only animates a direct child that is a motion component
 * with a stable key. Wrapping a plain `<div>` — as each page used to — meant
 * the whole subtree unmounted instantly and every exit animation was dropped.
 * Keeping the presence logic in one place fixes that once for all callers.
 */
export default function Modal({
  open,
  onClose,
  dismissable = true,
  size = "md",
  panelClassName = "border-white/8",
  labelledBy,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissable) onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismissable, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="admin-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={() => dismissable && onClose()}
            aria-hidden="true"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={`w-full ${SIZES[size]} p-5 sm:p-6 rounded-2xl border glass-panel relative z-10 space-y-4 max-h-[90vh] overflow-y-auto ${panelClassName}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
