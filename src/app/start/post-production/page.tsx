import type { Metadata } from "next";
import CampaignLanding from "@/components/campaign/CampaignLanding";
import { CAMPAIGN_VARIANTS } from "@/lib/campaigns";
import { campaignJsonLd, campaignMetadata } from "@/lib/campaignSeo";

const variant = CAMPAIGN_VARIANTS["start-post"];

const SEO = {
  title: "Post Production Management Software: Start Free",
  description:
    "Get to final cut with fewer rounds lost. Deliverables, versioned revision rounds, approvals and post schedules, with AI credit spend tracked per job.",
  keywords: [
    "post production management software",
    "video editing project management",
    "deliverable review and approval",
    "revision rounds tracking",
    "post production scheduling",
    "AI creative workflow software",
  ],
};

export const metadata: Metadata = campaignMetadata(variant, SEO);

export default function StartPostProductionPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: campaignJsonLd(variant, { ...SEO, breadcrumbName: "For Post Production" }),
        }}
      />
      <CampaignLanding variant={variant} />
    </>
  );
}
