"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Share2 } from "lucide-react";
import {
  buildLinkHubTheme,
  isLinkLive,
  linkHost,
  normalizeImageUrl,
  type LinkHubLink,
  type LinkHubSettings,
} from "@/lib/linkHub";
import AbramMark from "@/components/AbramMark";
import LinkHubIcon from "./LinkHubIcon";
import LinkHubShare from "./LinkHubShare";

/**
 * The link hub page body.
 *
 * The same component renders the live page and the admin live preview,
 * so what an editor sees while theming is exactly what ships. In preview
 * mode nothing is tracked and no link is followed.
 */

const AVATAR_RADIUS: Record<string, string> = {
  circle: "9999px",
  rounded: "22%",
  square: "0px",
};

/** One id per browsing session, so a refresh is not a second visit. */
function sessionId(): string {
  const key = "lh_session";
  try {
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.sessionStorage.setItem(key, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track/link", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  fetch("/api/track/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    /* tracking is best effort and never blocks a click */
  });
}

export default function LinkHubView({
  links,
  settings,
  shareUrl,
  preview = false,
}: {
  links: LinkHubLink[];
  settings: LinkHubSettings;
  shareUrl: string;
  preview?: boolean;
}) {
  const theme = useMemo(() => buildLinkHubTheme(settings), [settings]);
  const viewSent = useRef(false);

  useEffect(() => {
    if (preview || viewSent.current) return;
    viewSent.current = true;
    send({
      type: "view",
      sessionId: sessionId(),
      visit: {
        referrer: document.referrer || null,
        language: navigator.language || null,
      },
    });
  }, [preview]);

  const registerClick = (id: string) => {
    if (preview) return;
    send({ type: "click", linkId: id, sessionId: sessionId() });
  };

  // Scheduling is applied here as well as in the query so the preview and
  // a cached page never show a block outside its window.
  const live = useMemo(
    () => (preview ? links.filter((link) => link.is_active) : links.filter((link) => isLinkLive(link))),
    [links, preview],
  );

  const socials = live.filter((link) => link.block_type === "social");
  const blocks = live.filter((link) => link.block_type !== "social");

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
      className={`lh-page relative w-full px-5 pb-16 ${preview ? "min-h-0" : ""}`}
      style={
        {
          ...theme.vars,
          "--lh-bg-blur": `${Math.max(0, Math.min(40, settings.background_blur))}px`,
          "--lh-bg-overlay": Math.max(0, Math.min(90, settings.background_overlay)) / 100,
          background: theme.background,
        } as React.CSSProperties
      }
    >
      {/* The one webfont this page asked for, if any. See LinkPageView. */}
      {theme.fontStylesheet ? <link rel="stylesheet" href={theme.fontStylesheet} /> : null}

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
                onClick={(event) => {
                  if (preview) event.preventDefault();
                  registerClick(social.id);
                }}
                className="lh-social"
              >
                <LinkHubIcon icon={social.icon} className="w-[18px] h-[18px]" />
              </a>
            ))}

            {settings.share_enabled ? (
              preview ? (
                <span className="lh-social" aria-hidden="true">
                  <Share2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </span>
              ) : (
                <LinkHubShare
                  url={shareUrl}
                  title={settings.heading}
                  onShared={() => send({ type: "share", sessionId: sessionId() })}
                />
              )
            ) : null}
          </div>
        ) : null}

        {/* Blocks */}
        <div className="flex flex-col mt-8" style={{ gap: "var(--lh-stack)" }}>
          {blocks.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "var(--lh-faint)" }}>
              No links have been published yet.
            </p>
          ) : null}

          {blocks.map((block, index) => {
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
            const highlight =
              block.highlight !== "none" ? `lh-highlight-${block.highlight}` : "";

            return (
              <motion.a
                key={block.id}
                href={block.url}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                onClick={(event) => {
                  if (preview) event.preventDefault();
                  registerClick(block.id);
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
                className={`lh-btn transform-gpu ${block.is_featured ? "lh-btn--featured" : ""} ${highlight}`}
              >
                {thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbnail}
                    alt=""
                    aria-hidden="true"
                    className="lh-thumb rounded-xl object-cover shrink-0"
                  />
                ) : settings.show_icons ? (
                  <span className="lh-btn-icon shrink-0">
                    <LinkHubIcon
                      icon={block.icon}
                      className=""
                      style={{ width: theme.iconSize, height: theme.iconSize }}
                    />
                  </span>
                ) : null}

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
