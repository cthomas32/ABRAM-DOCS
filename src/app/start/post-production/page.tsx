import type { Metadata } from "next";
import CampaignLanding from "@/components/campaign/CampaignLanding";
import { CAMPAIGN_VARIANTS } from "@/lib/campaigns";
import { campaignJsonLd, campaignMetadata } from "@/lib/campaignSeo";

const variant = CAMPAIGN_VARIANTS["start-post"];

const SEO = {
  title: "Post Production Management Software: Start Free",
  description:
    "Get to final cut faster with fewer rounds lost. Deliverables, versioned revision rounds, approvals and post schedules in one free workspace, with editor hours and AI credit spend tracked against every job.",
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
