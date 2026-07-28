import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import type { CampaignVariant } from "./campaigns";

/**
 * Shared Open Graph card renderer for the campaign landing pages.
 *
 * These pages exist to catch social traffic, so the share preview is part
 * of the product: a link pasted into Reddit, X or a TikTok bio should show
 * that page's own promise rather than a generic site card.
 *
 * Rendered with Satori, which supports a subset of CSS. Every element that
 * holds more than one child needs an explicit `display: flex`, and layout
 * is flexbox only (no grid).
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** The lockup is 1920x385, so the card keeps that 4.99:1 ratio. */
const LOCKUP_WIDTH = 230;
const LOCKUP_HEIGHT = Math.round((LOCKUP_WIDTH * 385) / 1920);

/**
 * Satori cannot resolve a relative asset path, so the lockup is read off
 * disk and inlined. Cached at module scope: these cards are generated once
 * per build, but the route can also be hit at runtime.
 */
let lockupPromise: Promise<string> | null = null;

function getLockupDataUri(): Promise<string> {
  if (!lockupPromise) {
    lockupPromise = readFile(path.join(process.cwd(), "public", "abram-logo-lockup-cream.png"))
      .then((file) => `data:image/png;base64,${file.toString("base64")}`)
      .catch((err) => {
        console.error("OG card: could not read the ABRAM lockup:", err);
        lockupPromise = null;
        return "";
      });
  }
  return lockupPromise;
}

export async function renderCampaignOgImage(variant: CampaignVariant) {
  const lockup = await getLockupDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0A0A0A",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        {/* Ambient brand wash. Satori renders radial gradients with a hard
            edge, so this uses a linear wash across the card instead. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 300,
            background:
              "linear-gradient(160deg, rgba(142,202,255,0.14) 0%, rgba(59,130,246,0.05) 45%, rgba(10,10,10,0) 100%)",
            display: "flex",
          }}
        />

        {/* Accent rule, echoes the laser detail on the site */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 320,
            height: 3,
            background: "linear-gradient(90deg, #8ECAFF 0%, rgba(59,130,246,0) 100%)",
            display: "flex",
          }}
        />

        {/* Brand lockup. Falls back to the wordmark only if the file is
            unreadable, so a card is never published without branding. */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {lockup ? (
            <img src={lockup} width={LOCKUP_WIDTH} height={LOCKUP_HEIGHT} alt="ABRAM" />
          ) : (
            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: "#FAFAF9",
                letterSpacing: "0.18em",
                display: "flex",
              }}
            >
              ABRAM
            </div>
          )}
        </div>

        {/* Headline block */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "0.2em",
              color: "#8ECAFF",
              marginBottom: 26,
              display: "flex",
            }}
          >
            {variant.eyebrow}
          </div>

          <div
            style={{
              fontSize: 68,
              fontWeight: 500,
              color: "#FFFFFF",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              display: "flex",
            }}
          >
            {variant.headline}
          </div>

          <div
            style={{
              fontSize: 68,
              fontWeight: 500,
              color: "#A1A1AA",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              marginTop: 6,
              display: "flex",
            }}
          >
            {variant.headlineAccent}
          </div>
        </div>

        {/* Footer line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.10)",
            paddingTop: 26,
          }}
        >
          <div style={{ fontSize: 24, color: "#A1A1AA", display: "flex" }}>{variant.trustLine}</div>
          <div style={{ fontSize: 24, color: "#71717A", display: "flex" }}>abram.network</div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
