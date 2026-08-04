import type { Metadata } from "next";
import CampaignLanding from "@/components/campaign/CampaignLanding";
import { CAMPAIGN_VARIANTS } from "@/lib/campaigns";
import { campaignJsonLd, campaignMetadata } from "@/lib/campaignSeo";

const variant = CAMPAIGN_VARIANTS.start;

const SEO = {
  title: "Get Started Free: Production Management in One Workspace",
  description:
    "Turn any idea into a film, campaign, or project. Schedules, crew, call sheets, gear and budgets in one free workspace. Start your first project today.",
  keywords: [
    "free production management",
    "production workspace",
    "shoot day planning",
    "creative agency operations",
  ],
};

export const metadata: Metadata = campaignMetadata(variant, SEO);

export default function StartPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: campaignJsonLd(variant, { ...SEO, breadcrumbName: "Get Started" }),
        }}
      />
      <CampaignLanding variant={variant} />
    </>
  );
}
