"use client";

import CampaignVisual from "@/components/campaign/CampaignVisual";

export default function ScopeMockups() {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
      <CampaignVisual kind="chat" className="h-full flex flex-col" />
      <CampaignVisual kind="schedule" className="h-full flex flex-col" />
      <CampaignVisual kind="portal" className="h-full flex flex-col" />
    </div>
  );
}
