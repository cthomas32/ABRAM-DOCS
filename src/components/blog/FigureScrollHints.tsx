"use client";

import { useEffect } from "react";

/**
 * Article figures (tables and labelled charts) sit in a horizontal scroller on
 * phones. A swipe hint only makes sense on the ones that genuinely overflow, so
 * mark those and let the stylesheet decide what to show.
 */
export default function FigureScrollHints({ selector = ".blog-article" }: { selector?: string }) {
  useEffect(() => {
    const root = document.querySelector(selector);
    if (!root) return;

    const figures = Array.from(root.querySelectorAll<HTMLElement>(".mdx-figure"));
    if (figures.length === 0) return;

    const measure = () => {
      for (const figure of figures) {
        const scroller = figure.querySelector<HTMLElement>(".mdx-scroll");
        if (!scroller) continue;
        const overflows = scroller.scrollWidth - scroller.clientWidth > 1;
        if (overflows) {
          figure.dataset.scrollable = "true";
        } else {
          delete figure.dataset.scrollable;
        }
      }
    };

    measure();

    const observer = new ResizeObserver(measure);
    figures.forEach((figure) => {
      const scroller = figure.querySelector(".mdx-scroll");
      if (scroller) observer.observe(scroller);
    });

    // Web fonts land after first paint and change how much a table needs.
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    return () => observer.disconnect();
  }, [selector]);

  return null;
}
