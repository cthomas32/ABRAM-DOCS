"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { LinkHubLink } from "@/lib/linkHub";
import { linkHost } from "@/lib/linkHub";
import LinkHubIcon from "./LinkHubIcon";

/**
 * The link list on the public hub page.
 *
 * A click is reported with sendBeacon so the count is recorded without
 * delaying navigation, and the anchor is never blocked on the request.
 */
export default function LinkHubList({ links }: { links: LinkHubLink[] }) {
  const registerClick = (id: string) => {
    const payload = JSON.stringify({ linkId: id });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track/link", new Blob([payload], { type: "application/json" }));
        return;
      }
    } catch {
      /* fall through to fetch */
    }
    fetch("/api/track/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      /* click tracking is best effort */
    });
  };

  if (links.length === 0) {
    return (
      <p className="text-sm text-zinc-500 text-center py-10">No links have been published yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {links.map((link, index) => {
        const rawHost = linkHost(link.url);
        // Only worth showing when the link leaves our own site.
        const host = rawHost && rawHost !== "abram.network" ? rawHost : null;
        const isExternal = !link.url.startsWith("/");

        return (
          <motion.a
            key={link.id}
            href={link.url}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            onClick={() => registerClick(link.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: Math.min(index * 0.04, 0.3),
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`group relative flex items-center gap-4 rounded-2xl border px-5 py-4 min-h-[64px] transition-colors duration-200 cursor-pointer transform-gpu ${
              link.is_featured
                ? "border-white/15 bg-white text-black hover:bg-zinc-200"
                : "border-white/8 bg-zinc-950/40 backdrop-blur-md text-white hover:border-white/20 hover:bg-zinc-900/50"
            }`}
          >
            <span className={link.is_featured ? "text-black shrink-0" : "text-zinc-300 shrink-0"}>
              <LinkHubIcon icon={link.icon} className="w-4 h-4" />
            </span>

            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold tracking-tight break-words text-balance">
                {link.label}
              </span>
              {link.description ? (
                <span
                  className={`block text-xs mt-0.5 leading-relaxed break-words text-pretty ${
                    link.is_featured ? "text-black/60" : "text-zinc-500"
                  }`}
                >
                  {link.description}
                </span>
              ) : null}
            </span>

            <span className="flex flex-col items-end gap-0.5 shrink-0">
              <ArrowUpRight
                className={`w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${
                  link.is_featured ? "text-black/70" : "text-zinc-500"
                }`}
              />
              {host ? (
                <span
                  className={`text-[9px] font-mono ${
                    link.is_featured ? "text-black/40" : "text-zinc-600"
                  }`}
                >
                  {host}
                </span>
              ) : null}
            </span>
          </motion.a>
        );
      })}
    </div>
  );
}
