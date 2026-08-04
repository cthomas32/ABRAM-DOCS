import { SOCIAL_FORMATS } from "./social/formats";
import { renderSocialImage, OG_CONTENT_TYPE } from "./social/render";
import type { SocialImageSpec } from "./social/spec";
import type { CampaignVariant } from "./campaigns";

/**
 * Open Graph cards for the campaign landing pages.
 *
 * These pages exist to catch social traffic, so the share preview is part
 * of the product: a link pasted into Reddit, X or a TikTok bio should show
 * that page's own promise rather than a generic site card.
 *
 * The drawing itself now lives in `social/render`, which serves the same
 * card at five aspect ratios for the social studio. This file is the
 * mapping from a campaign variant to a spec, and nothing more.
 */

export const OG_SIZE = { width: SOCIAL_FORMATS.landscape.width, height: SOCIAL_FORMATS.landscape.height };
export { OG_CONTENT_TYPE };

/** The card a campaign page shares as, also the starting point when someone opens that campaign in the studio. */
export function campaignToSpec(variant: CampaignVariant): Partial<SocialImageSpec> {
  return {
    template: "statement",
    format: "landscape",
    theme: "midnight",
    eyebrow: variant.eyebrow,
    headline: variant.headline,
    headlineAccent: variant.headlineAccent,
    footnote: variant.trustLine,
    cta: "abram.network",
  };
}

export async function renderCampaignOgImage(variant: CampaignVariant) {
  return renderSocialImage(campaignToSpec(variant));
}
