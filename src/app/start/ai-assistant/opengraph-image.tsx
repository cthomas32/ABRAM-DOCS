import { renderCampaignOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/campaignOgImage";
import { CAMPAIGN_VARIANTS } from "@/lib/campaigns";

const variant = CAMPAIGN_VARIANTS["start-assistant"];

export const alt = `ABRAM: ${variant.headline} ${variant.headlineAccent}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OpengraphImage() {
  return renderCampaignOgImage(variant);
}
