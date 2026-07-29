"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export interface SheetAction {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Renders as a link when set, otherwise as a button. */
  href?: string;
  /** Opens the link in a new tab. */
  external?: boolean;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  actions: SheetAction[];
}

/**
 * The overflow menu behind every list row's "more" control.
 *
 * One menu serves both breakpoints: a bottom sheet on phones, a centred
 * dialog from `sm` up. That lets a card show a single control instead of a
 * crowded row of icon buttons that wraps and collides in a narrow column.
 */
export default function ActionSheet({ open, onClose, title, subtitle, actions }: ActionSheetProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="action-sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex flex-col sm:items-center sm:justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative z-10 mt-auto w-full max-h-[85vh] flex flex-col bg-[#0C0C0C] border-t border-white/10 rounded-t-3xl shadow-2xl sm:mt-0 sm:max-w-sm sm:rounded-3xl sm:border"
          >
            <div className="shrink-0 px-5 pt-3 pb-3 border-b border-white/5">
              <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4 sm:hidden" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{title}</p>
                  {subtitle && <p className="text-[11px] text-zinc-500 truncate mt-0.5">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close menu"
                  className="w-11 h-11 sm:w-8 sm:h-8 -mr-2 -mt-2 sm:-mr-1 sm:-mt-1 shrink-0 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.08] transition-colors"
                >
                  <X className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-3">
              {actions.map((action) => {
                const Icon = action.icon;
                const inner = (
                  <>
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        action.danger
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-white/[0.03] text-zinc-300 border-white/8"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className={`block text-sm font-semibold truncate ${action.danger ? "text-red-400" : "text-zinc-100"}`}>
                        {action.label}
                      </span>
                      {action.hint && <span className="block text-[11px] text-zinc-500 truncate">{action.hint}</span>}
                    </span>
                  </>
                );

                const className =
                  "w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl min-h-[56px] sm:min-h-[52px] transition-colors hover:bg-white/[0.04] active:bg-white/[0.06] disabled:opacity-40";

                if (action.href && !action.disabled) {
                  return (
                    <Link
                      key={action.id}
                      href={action.href}
                      target={action.external ? "_blank" : undefined}
                      rel={action.external ? "noopener noreferrer" : undefined}
                      onClick={onClose}
                      className={className}
                    >
                      {inner}
                    </Link>
                  );
                }

                return (
                  <button
                    key={action.id}
                    type="button"
                    disabled={action.disabled}
                    onClick={() => {
                      onClose();
                      action.onClick?.();
                    }}
                    className={className}
                  >
                    {inner}
                  </button>
                );
              })}
            </div>

            {/* Phones need a thumb-reachable dismiss; the dialog has its close
                button and the backdrop, so the extra bar would just be noise. */}
            <div className="sm:hidden shrink-0 border-t border-white/5 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                onClick={onClose}
                className="btn-glass w-full h-12 text-xs font-semibold rounded-full"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
