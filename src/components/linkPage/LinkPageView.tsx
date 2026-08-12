"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import {
  buildLinkHubTheme,
  linkHost,
  normalizeImageUrl,
  type LinkHubLink,
  type LinkHubSettings,
} from "@/lib/linkHub";
import AbramMark from "@/components/AbramMark";
import LinkHubIcon from "@/components/links/LinkHubIcon";
import LinkHubShare from "@/components/links/LinkHubShare";

/**
 * The public creator bio page body, rendered at /l/<slug>.
 *
 * This is a sibling of src/components/links/LinkHubView.tsx, not a reuse of
 * it: that component posts view/click events to this repo's own
 * /api/track/link, which has nothing to do with a creator's page in the
 * abram-network product database. This one posts to /api/l-track instead,
 * which proxies record_link_page_event() over there. Everything themeable —
 * the `.lh-*` classes, buildLinkHubTheme, the icon set, the share sheet — is
 * shared with LinkHubView on purpose: the two products are meant to read as
 * one visual language, per the shared column vocabulary the two schemas
 * already agree on.
 */

const AVATAR_RADIUS: Record<string, string> = {
  circle: "9999px",
  rounded: "22%",
  square: "0px",
};

function track(slug: string, blockId?: string) {
  const body = JSON.stringify({ slug, blockId });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/l-track", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  fetch("/api/l-track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    /* tracking is best effort and never blocks a click */
  });
}

export default function LinkPageView({
  slug,
  settings,
  blocks,
  shareUrl,
}: {
  slug: string;
  settings: LinkHubSettings;
  blocks: LinkHubLink[];
  shareUrl: string;
}) {
  const theme = useMemo(() => buildLinkHubTheme(settings), [settings]);
  const viewSent = useRef(false);

  useEffect(() => {
    if (viewSent.current) return;
    viewSent.current = true;
    track(slug);
  }, [slug]);

  // The public_link_blocks view already filters to published + active +
  // in-window rows, so no client-side schedule filtering is needed here —
  // this is only a defensive re-check in case a cached page outlives a
  // block's window before the next revalidation.
  const now = Date.now();
  const live = blocks.filter((block) => {
    if (block.starts_at && new Date(block.starts_at).getTime() > now) return false;
    if (block.ends_at && new Date(block.ends_at).getTime() <= now) return false;
    return true;
  });

  const socials = live.filter((link) => link.block_type === "social");
  const items = live.filter((link) => link.block_type !== "social");

  const avatar =
    settings.avatar_kind === "image" && settings.avatar_url
      ? normalizeImageUrl(settings.avatar_url)
      : null;
  const avatarRadius = AVATAR_RADIUS[settings.avatar_shape] ?? "22%";

  const backgroundImage =
    settings.background_style === "image" && settings.background_image_url
      ? normalizeImageUrl(settings.background_image_url)
      : null;

  return (
    <div
      className={`lh-page ${theme.fontClass} relative w-full px-5 pb-16`}
      style={
        {
          ...theme.vars,
          "--lh-bg-blur": `${Math.max(0, Math.min(40, settings.background_blur))}px`,
          "--lh-bg-overlay": Math.max(0, Math.min(90, settings.background_overlay)) / 100,
          background: theme.background,
        } as React.CSSProperties
      }
    >
      {backgroundImage ? (
        <div className="lh-bg-lock" aria-hidden="true">
          <div
            className="lh-bg-image"
            style={{ backgroundImage: `url("${encodeURI(backgroundImage)}")` }}
          />
          <div className="lh-bg-overlay" />
        </div>
      ) : null}

      <div className="relative z-[1] w-full max-w-[520px] mx-auto flex flex-col pt-14">
        {/* Identity */}
        <div className="flex flex-col items-center text-center">
          {settings.avatar_kind === "abram" ? (
            <span
              className="w-[88px] h-[88px] mb-4 flex items-center justify-center overflow-hidden bg-black/40"
              style={{ borderRadius: avatarRadius, border: "1px solid var(--lh-hairline)" }}
            >
              <AbramMark size={88} className="rounded-none w-full h-full" />
            </span>
          ) : avatar ? (
            // Avatars come from arbitrary hosts, so this stays a plain image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              aria-hidden="true"
              width={88}
              height={88}
              className="w-[88px] h-[88px] object-cover mb-4"
              style={{ borderRadius: avatarRadius, border: "1px solid var(--lh-hairline)" }}
            />
          ) : null}

          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-balance break-words">
            {settings.heading}
          </h1>

          {settings.subheading ? (
            <p
              className="mt-2 text-sm leading-relaxed text-pretty max-w-[38ch]"
              style={{ color: "var(--lh-muted)" }}
            >
              {settings.subheading}
            </p>
          ) : null}
        </div>

        {/* Socials and share */}
        {socials.length > 0 || settings.share_enabled ? (
          <div className="flex flex-wrap items-center justify-center gap-1 mt-5">
            {socials.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                title={social.label}
                onClick={() => track(slug, social.id)}
                className="lh-social"
              >
                <LinkHubIcon icon={social.icon} className="w-[18px] h-[18px]" />
              </a>
            ))}

            {settings.share_enabled ? (
              <LinkHubShare
                url={shareUrl}
                title={settings.heading}
                onShared={() => track(slug)}
              />
            ) : null}
          </div>
        ) : null}

        {/* Blocks */}
        <div className="flex flex-col mt-8" style={{ gap: "var(--lh-stack)" }}>
          {items.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--lh-faint)" }}>
              No links have been published yet.
            </p>
          ) : null}

          {items.map((block, index) => {
            const delay = Math.min(index * 0.04, 0.32);

            if (block.block_type === "header") {
              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 pt-4 pb-1 first:pt-0"
                >
                  <span className="h-px flex-1" style={{ background: "var(--lh-hairline)" }} />
                  <span
                    className="text-[10px] font-semibold tracking-[0.2em] uppercase whitespace-nowrap"
                    style={{ color: "var(--lh-faint)" }}
                  >
                    {block.label}
                  </span>
                  <span className="h-px flex-1" style={{ background: "var(--lh-hairline)" }} />
                </motion.div>
              );
            }

            const rawHost = linkHost(block.url);
            const host = rawHost && rawHost !== "abram.network" ? rawHost : null;
            const isExternal = !block.url.startsWith("/");
            const thumbnail = block.thumbnail_url ? normalizeImageUrl(block.thumbnail_url) : null;
            const highlight = block.highlight !== "none" ? `lh-highlight-${block.highlight}` : "";

            return (
              <motion.a
                key={block.id}
                href={block.url}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                onClick={() => track(slug, block.id)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
                className={`lh-btn transform-gpu ${highlight}`}
              >
                {thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnail}
                    alt=""
                    aria-hidden="true"
                    className="lh-thumb rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <span className="lh-btn-icon shrink-0">
                    <LinkHubIcon
                      icon={block.icon}
                      className=""
                      style={{ width: theme.iconSize, height: theme.iconSize }}
                    />
                  </span>
                )}

                <span className="flex-1 min-w-0 text-left">
                  <span className="lh-btn-label block font-medium tracking-[-0.011em] break-words text-balance">
                    {block.label}
                  </span>
                  {block.description ? (
                    <span className="lh-btn-desc block mt-1 leading-relaxed break-words text-pretty opacity-55">
                      {block.description}
                    </span>
                  ) : null}
                </span>

                <span className="flex flex-col items-end gap-0.5 shrink-0 opacity-45">
                  <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
                  {host ? <span className="text-[9px] font-mono opacity-70">{host}</span> : null}
                </span>
              </motion.a>
            );
          })}
        </div>

        {settings.footer_note ? (
          <p
            className="mt-9 text-center text-xs leading-relaxed text-pretty"
            style={{ color: "var(--lh-faint)" }}
          >
            {settings.footer_note}
          </p>
        ) : null}
      </div>
    </div>
  );
}
