"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Play } from "lucide-react";
import {
  blockHref,
  buildLinkHubTheme,
  linkHost,
  normalizeImageUrl,
  parseVideoEmbed,
  type LinkHubLink,
  type LinkHubSettings,
} from "@/lib/linkHub";
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
 *
 * IN LOCKSTEP WITH abram-network's LinkPagePreview.tsx. Both render the same
 * rows from the same views, and a visitor must not be able to tell which one
 * served the page. Any change to block types, layout, the socials strip or the
 * branding credit belongs in both files in the same commit.
 *
 * MOBILE FIRST. Almost every visitor arrives by tapping a bio link on a phone.
 * One column at every width, 44px targets, no hover that touch can strand,
 * fixed aspect boxes so nothing reflows under a moving thumb, and safe-area
 * padding — all of it carried by the `.lh-*` classes in globals.css so the two
 * repos cannot drift on it.
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

/** True for a destination the browser should open in a new tab. */
function isExternal(href: string | null): boolean {
  return !!href && !href.startsWith("/") && !/^(mailto|tel):/i.test(href);
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

  // One pass turns the flat list into the two things the renderer needs: the
  // top level, and each collection's children.
  const { items, socials, childrenOf } = useMemo(() => {
    const children = new Map<string, LinkHubLink[]>();
    const top: LinkHubLink[] = [];
    const socialBlocks: LinkHubLink[] = [];

    for (const block of live) {
      if (block.parent_id) {
        const bucket = children.get(block.parent_id);
        if (bucket) bucket.push(block);
        else children.set(block.parent_id, [block]);
        continue;
      }
      if (block.block_type === "social") socialBlocks.push(block);
      else top.push(block);
    }

    for (const list of children.values()) list.sort((a, b) => a.sort_order - b.sort_order);

    return { items: top, socials: socialBlocks, childrenOf: children };
    // `live` is derived from `blocks` on every render; keying on `blocks` keeps
    // the memo stable rather than recomputing for a new array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  const avatar =
    settings.avatar_kind === "image" && settings.avatar_url
      ? normalizeImageUrl(settings.avatar_url)
      : null;
  const avatarRadius = AVATAR_RADIUS[settings.avatar_shape] ?? "22%";

  const backgroundImage =
    settings.background_style === "image" && settings.background_image_url
      ? normalizeImageUrl(settings.background_image_url)
      : null;

  const grid = settings.link_display === "grid";

  /** A small tile — inside a collection, and in grid display mode. */
  const renderTile = (block: LinkHubLink) => {
    const href = blockHref(block);
    const video = block.block_type === "embed_video" ? parseVideoEmbed(block.url) : null;
    const photo =
      (block.thumbnail_url ? normalizeImageUrl(block.thumbnail_url) : null) ??
      video?.thumbnailUrl ??
      null;
    const highlight = block.highlight !== "none" ? `lh-highlight-${block.highlight}` : "";

    return (
      <a
        key={block.id}
        href={href ?? undefined}
        target={isExternal(href) ? "_blank" : undefined}
        rel="noopener noreferrer"
        aria-disabled={href ? undefined : true}
        onClick={() => track(slug, block.id)}
        className={`lh-tile ${photo ? "lh-tile--photo" : ""} ${highlight}`}
        style={photo ? { backgroundImage: `url("${encodeURI(photo)}")` } : undefined}
      >
        {!photo ? (
          <span className="lh-btn-icon">
            <LinkHubIcon icon={block.icon} className="" style={{ width: 18, height: 18 }} />
          </span>
        ) : null}
        <span className="lh-tile-label">{block.label || "Untitled"}</span>
      </a>
    );
  };

  /** A video card: the provider's own still, a play glyph, and a link out. */
  const renderVideo = (block: LinkHubLink) => {
    const video = parseVideoEmbed(block.url);
    const still =
      (block.thumbnail_url ? normalizeImageUrl(block.thumbnail_url) : null) ??
      video?.thumbnailUrl ??
      null;
    const href = video?.watchUrl ?? blockHref(block);

    return (
      <a
        key={block.id}
        href={href ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={block.label || "Watch the video"}
        onClick={() => track(slug, block.id)}
        className={`lh-video ${grid ? "lh-span" : ""}`}
      >
        <span
          className="lh-video-frame block"
          style={still ? { backgroundImage: `url("${encodeURI(still)}")` } : undefined}
        >
          <span className="lh-video-play">
            <span>
              <Play className="w-5 h-5 ml-0.5" fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        </span>
        {block.label ? (
          <span className="lh-video-caption">
            <span className="flex-1 min-w-0 font-medium break-words">{block.label}</span>
            <ArrowUpRight className="w-4 h-4 shrink-0 opacity-45" strokeWidth={1.5} />
          </span>
        ) : null}
      </a>
    );
  };

  /** A full-width button — the classic row, and the featured poster card. */
  const renderButton = (block: LinkHubLink, delay: number) => {
    const href = blockHref(block);
    const rawHost = linkHost(block.url);
    const host = rawHost && rawHost !== "abram.network" ? rawHost : null;
    const thumbnail = block.thumbnail_url ? normalizeImageUrl(block.thumbnail_url) : null;
    const highlight = block.highlight !== "none" ? `lh-highlight-${block.highlight}` : "";
    const featured = block.layout === "featured";

    return (
      <motion.a
        key={block.id}
        href={href ?? undefined}
        target={isExternal(href) ? "_blank" : undefined}
        rel={isExternal(href) ? "noopener noreferrer" : undefined}
        aria-disabled={href ? undefined : true}
        onClick={() => track(slug, block.id)}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
        className={`lh-btn lh-tap transform-gpu ${highlight} ${
          featured ? `lh-btn--featured ${thumbnail ? "lh-btn--photo" : ""} ${grid ? "lh-span" : ""}` : ""
        }`}
        style={featured && thumbnail ? { backgroundImage: `url("${encodeURI(thumbnail)}")` } : undefined}
      >
        {featured ? null : thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
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
            {block.label || "Untitled"}
          </span>
          {block.description ? (
            <span className="lh-btn-desc block mt-1 leading-relaxed break-words text-pretty opacity-55">
              {block.description}
            </span>
          ) : null}
        </span>

        {featured ? null : (
          <span className="flex flex-col items-end gap-0.5 shrink-0 opacity-45">
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
            {host ? <span className="text-[9px] font-mono opacity-70">{host}</span> : null}
          </span>
        )}
      </motion.a>
    );
  };

  const renderBlock = (block: LinkHubLink, index: number) => {
    const delay = Math.min(index * 0.04, 0.32);

    if (block.block_type === "header") {
      return (
        <motion.div
          key={block.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
          className={`flex items-center gap-3 pt-4 pb-1 first:pt-0 ${grid ? "lh-span" : ""}`}
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

    if (block.block_type === "collection") {
      const children = childrenOf.get(block.id) ?? [];
      if (children.length === 0) return null;
      return (
        <div key={block.id} className={grid ? "lh-span" : ""}>
          {block.label ? <div className="lh-collection-title">{block.label}</div> : null}
          <div className="lh-grid">{children.map(renderTile)}</div>
        </div>
      );
    }

    if (block.block_type === "embed_video") return renderVideo(block);

    // In grid display a plain link becomes a tile; a featured one stays a
    // poster and spans both columns, which is what makes "featured" mean
    // something in either display mode.
    if (grid && block.layout !== "featured") return renderTile(block);

    return renderButton(block, delay);
  };

  return (
    <div
      className={`lh-page ${theme.fontClass} relative w-full`}
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

      <div className="lh-col relative z-[1] flex flex-col pt-14">
        {/* Identity */}
        <div className="flex flex-col items-center text-center">
          {avatar ? (
            // Avatars come from arbitrary hosts, so this stays a plain image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              aria-hidden="true"
              width={88}
              height={88}
              decoding="async"
              className="w-[88px] h-[88px] object-cover mb-4 shrink-0"
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

        {/* Socials strip and share. Two sources feed one row: the page-level
            `socials` list, and any legacy `social` blocks, which keep working
            rather than vanishing from a live page. */}
        {settings.socials.length > 0 || socials.length > 0 || settings.share_enabled ? (
          <div className="flex flex-wrap items-center justify-center gap-1 mt-5">
            {settings.socials.map((social, index) => (
              <a
                key={`${social.platform}-${index}`}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.platform}
                title={social.platform}
                className="lh-social"
              >
                <LinkHubIcon icon={social.platform} className="w-[18px] h-[18px]" />
              </a>
            ))}

            {socials.map((social) => (
              <a
                key={social.id}
                href={blockHref(social) ?? undefined}
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
              <LinkHubShare url={shareUrl} title={settings.heading} onShared={() => track(slug)} />
            ) : null}
          </div>
        ) : null}

        {/* Blocks */}
        <div className={`mt-8 ${grid ? "lh-grid" : "flex flex-col"}`} style={{ gap: "var(--lh-stack)" }}>
          {items.length === 0 ? (
            <p
              className={`text-sm text-center py-10 ${grid ? "lh-span" : ""}`}
              style={{ color: "var(--lh-faint)" }}
            >
              No links have been published yet.
            </p>
          ) : null}

          {items.map(renderBlock)}
        </div>

        {settings.footer_note ? (
          <p
            className="mt-9 text-center text-xs leading-relaxed text-pretty"
            style={{ color: "var(--lh-faint)" }}
          >
            {settings.footer_note}
          </p>
        ) : null}

        {/* The credit.
            `show_branding` is resolved server-side by public_link_pages in the
            abram-network project — the owner's wish AND their plan — so this
            repo never sees a tier and never decides. Markup mirrors that repo's
            PoweredByAbram component, which cannot be imported across repos. */}
        {settings.show_branding ? (
          <div className="lh-credit flex justify-center">
            <p className="text-[11px] text-zinc-500">
              Powered by{" "}
              <a
                href="https://abram.network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-zinc-300 underline underline-offset-2 transition-colors"
              >
                ABRAM
              </a>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
