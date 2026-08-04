import type { Metadata } from "next";
import CampaignLanding from "@/components/campaign/CampaignLanding";
import { CAMPAIGN_VARIANTS } from "@/lib/campaigns";
import { campaignJsonLd, campaignMetadata } from "@/lib/campaignSeo";

const variant = CAMPAIGN_VARIANTS["start-assistant"];

const SEO = {
  title: "AI Assistant That Runs the Platform, No MCP Required",
  description:
    "ABRAM answers from your live workspace, drafts paperwork, and runs multi-step workflows. No MCP server, API keys, or integrations to set up.",
  keywords: [
    "AI assistant for production",
    "AI agent no MCP required",
    "AI project management assistant",
    "natural language production software",
    "AI action plan approval",
    "creative production AI copilot",
  ],
};

export const metadata: Metadata = campaignMetadata(variant, SEO);

export default function StartAiAssistantPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: campaignJsonLd(variant, { ...SEO, breadcrumbName: "For the AI Assistant" }),
        }}
      />
      <CampaignLanding variant={variant} />
    </>
  );
}
