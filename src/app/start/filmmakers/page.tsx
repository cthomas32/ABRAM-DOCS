import type { Metadata } from "next";
import CampaignLanding from "@/components/campaign/CampaignLanding";
import { CAMPAIGN_VARIANTS } from "@/lib/campaigns";
import { campaignJsonLd, campaignMetadata } from "@/lib/campaignSeo";

const variant = CAMPAIGN_VARIANTS["start-filmmakers"];

const SEO = {
  title: "Free Production Software for Filmmakers and Producers",
  description:
    "Get your shoot days on schedule. Script breakdown, shooting schedules, crew rosters, gear tracking and digital call sheets in one free workspace.",
  keywords: [
    "film production software free",
    "call sheet app",
    "shooting schedule software",
    "indie film production management",
    "videographer production tools",
  ],
};

export const metadata: Metadata = campaignMetadata(variant, SEO);

export default function StartFilmmakersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: campaignJsonLd(variant, { ...SEO, breadcrumbName: "For Filmmakers" }),
        }}
      />
      <CampaignLanding variant={variant} />
    </>
  );
}
