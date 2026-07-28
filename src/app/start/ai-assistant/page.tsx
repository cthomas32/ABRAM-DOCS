import type { Metadata } from "next";
import CampaignLanding from "@/components/campaign/CampaignLanding";
import { CAMPAIGN_VARIANTS } from "@/lib/campaigns";
import { campaignJsonLd, campaignMetadata } from "@/lib/campaignSeo";

const variant = CAMPAIGN_VARIANTS["start-assistant"];

const SEO = {
  title: "An AI Assistant That Runs the Whole Platform, No MCP Required",
  description:
    "Ask for it and approve it. ABRAM answers from your live workspace, drafts your paperwork and runs multi-step work, with no MCP server, API keys or integrations to set up.",
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
