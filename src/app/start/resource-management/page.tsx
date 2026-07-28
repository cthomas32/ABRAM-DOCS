import type { Metadata } from "next";
import CampaignLanding from "@/components/campaign/CampaignLanding";
import { CAMPAIGN_VARIANTS } from "@/lib/campaigns";
import { campaignJsonLd, campaignMetadata } from "@/lib/campaignSeo";

const variant = CAMPAIGN_VARIANTS["start-resources"];

const SEO = {
  title: "Equipment & Resource Scheduling Software: Start Free",
  description:
    "Never double book a camera or a crew again. Inventory, kits, barcodes and a draggable booking calendar for rental houses, gear managers and production teams.",
  keywords: [
    "equipment rental management software",
    "resource scheduling software",
    "gear inventory management",
    "camera rental booking software",
    "equipment booking calendar",
    "studio and stage scheduling",
    "crew and equipment management",
  ],
};

export const metadata: Metadata = campaignMetadata(variant, SEO);

export default function StartResourceManagementPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: campaignJsonLd(variant, { ...SEO, breadcrumbName: "For Resource Management" }),
        }}
      />
      <CampaignLanding variant={variant} />
    </>
  );
}
