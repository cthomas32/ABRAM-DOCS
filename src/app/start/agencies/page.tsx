import type { Metadata } from "next";
import CampaignLanding from "@/components/campaign/CampaignLanding";
import { CAMPAIGN_VARIANTS } from "@/lib/campaigns";
import { campaignJsonLd, campaignMetadata } from "@/lib/campaignSeo";

const variant = CAMPAIGN_VARIANTS["start-agencies"];

const SEO = {
  title: "Creative Agency Operations Software: Start Free",
  description:
    "Take on more work without hiring. See capacity, scope faster, and keep your margins with planning, intake, portals, and accounting in one workspace.",
  keywords: [
    "creative agency management software",
    "agency capacity planning",
    "studio resource management",
    "client portal for agencies",
    "production accounting software",
  ],
};

export const metadata: Metadata = campaignMetadata(variant, SEO);

export default function StartAgenciesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: campaignJsonLd(variant, { ...SEO, breadcrumbName: "For Agencies" }),
        }}
      />
      <CampaignLanding variant={variant} />
    </>
  );
}
