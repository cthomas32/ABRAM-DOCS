"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Download, Share2, X } from "lucide-react";
import { encodeQR } from "@/lib/qrcode";

/**
 * Share sheet for the link hub: copy the address, hand it to the system
 * share menu, or take away a QR code for print and on-set signage.
 *
 * The QR is generated in the browser from the page URL, so nothing is
 * fetched and the code always matches whatever address is being viewed.
 */
export default function LinkHubShare({
  url,
  title,
  onShared,
}: {
  url: string;
  title: string;
  onShared?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const matrix = useMemo(() => {
    try {
      return encodeQR(url);
    } catch {
      return null;
    }
  }, [url]);

  // Lock the page behind the sheet and let Escape close it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard access can be refused, the address is on screen anyway */
    }
  };

  const shareNative = async () => {
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title, url });
      onShared?.();
    } catch {
      /* dismissing the system sheet is not an error */
    }
  };

  /** Rasterise the code so it can be dropped straight into artwork. */
  const downloadQR = () => {
    if (!matrix) return;
    const modules = matrix.length;
    const scale = 16;
    const quiet = 4;
    const size = (modules + quiet * 2) * scale;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, size, size);
    context.fillStyle = "#000000";
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        if (!matrix[row][col]) continue;
        context.fillRect((col + quiet) * scale, (row + quiet) * scale, scale, scale);
      }
    }

    const anchor = document.createElement("a");
    anchor.href = canvas.toDataURL("image/png");
    anchor.download = "link-hub-qr.png";
    anchor.click();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Share this page"
        className="lh-social"
      >
        <Share2 className="w-[18px] h-[18px]" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Share this page"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950 p-6 text-white font-sans"
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold tracking-tight">Share</h2>
                  <p className="text-xs text-zinc-500 mt-0.5 break-all">{url}</p>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {matrix ? (
                <div className="flex justify-center mb-5">
                  <div className="rounded-2xl bg-white p-4">
                    <svg
                      viewBox={`0 0 ${matrix.length} ${matrix.length}`}
                      width={184}
                      height={184}
                      shapeRendering="crispEdges"
                      role="img"
                      aria-label="QR code for this page"
                    >
                      <rect width={matrix.length} height={matrix.length} fill="#FFFFFF" />
                      {matrix.map((row, r) =>
                        row.map((dark, c) =>
                          dark ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} /> : null,
                        ),
                      )}
                    </svg>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={copy}
                  className="flex items-center justify-center gap-2 w-full min-h-[44px] rounded-full bg-white text-black text-xs font-semibold cursor-pointer hover:bg-zinc-200 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy link"}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={shareNative}
                    className="flex items-center justify-center gap-2 min-h-[44px] rounded-full border border-white/10 bg-white/[0.03] text-xs font-semibold text-zinc-200 cursor-pointer hover:bg-white/[0.07] transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={downloadQR}
                    disabled={!matrix}
                    className="flex items-center justify-center gap-2 min-h-[44px] rounded-full border border-white/10 bg-white/[0.03] text-xs font-semibold text-zinc-200 cursor-pointer hover:bg-white/[0.07] transition-colors disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    QR code
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
