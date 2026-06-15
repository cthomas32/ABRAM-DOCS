"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface HeadingItem {
  id: string;
  text: string;
  level: string;
}

export default function TableOfContents() {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    // We delay the query slightly to ensure MDX has finished rendering
    const timer = setTimeout(() => {
      const headingElements = Array.from(document.querySelectorAll("article h2, article h3"))
        .filter((el) => !el.closest(".sr-only"));
      const items = headingElements.map((el) => ({
        id: el.id,
        text: el.textContent || "",
        level: el.tagName.toLowerCase(),
      }));
      setHeadings(items);

      if (items.length > 0) {
        setActiveIndex(0);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const headingElements = Array.from(document.querySelectorAll("article h2, article h3"))
        .filter((el) => !el.closest(".sr-only"));
      if (headingElements.length === 0) return;

      const threshold = 120; // offset for navbar
      let activeIdx = 0;

      // Check if we are scrolled to the bottom of the page
      const scrollPosition = window.innerHeight + window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const isAtBottom = window.scrollY > 0 && scrollPosition >= scrollHeight - 50;

      if (isAtBottom) {
        activeIdx = headingElements.length - 1;
      } else {
        for (let i = 0; i < headingElements.length; i++) {
          const el = headingElements[i];
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold) {
            activeIdx = i;
          }
        }
      }

      setActiveIndex(activeIdx);
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll);
    handleScroll(); // initial check

    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  const hasHeadings = headings.length > 0;

  return (
    <nav
      className={`w-56 shrink-0 sticky top-24 hidden xl:block self-start pl-4 py-1 transition-all duration-200 ${
        hasHeadings ? "border-l border-zinc-900" : ""
      }`}
    >
      {hasHeadings && (
        <>
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 text-neutral-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            <span>On this page</span>
          </div>
          <div className="relative space-y-2.5">
            {headings.map((heading, index) => {
              const isActive = activeIndex === index;
              return (
                <div key={`${heading.id || "heading"}-${index}`} className="relative pl-4">
                  {isActive && (
                    <motion.div
                      layoutId="active-toc-line"
                      className="absolute left-[-17px] top-0 bottom-0 w-[2px] bg-zinc-200"
                      transition={{ type: "spring", stiffness: 350, damping: 35 }}
                    />
                  )}
                  <a
                    href={`#${heading.id}`}
                    className={`block text-xs transition-colors duration-200 hover:text-neutral-200 leading-normal ${
                      heading.level === "h3" ? "pl-3 text-[11px]" : ""
                    } ${
                      isActive
                        ? "text-zinc-100 font-semibold"
                        : "text-zinc-500 font-medium"
                    }`}
                  >
                    {heading.text}
                  </a>
                </div>
              );
            })}
          </div>
        </>
      )}
    </nav>
  );
}
