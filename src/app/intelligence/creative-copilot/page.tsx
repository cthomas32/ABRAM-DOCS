import type { Metadata } from "next";
import CreativeCopilotClient from "@/app/intelligence/creative-copilot/CreativeCopilotClient";

export const metadata: Metadata = {
  title: "ABRAM Playground — Interactive Studio AI | ABRAM Network",
  description: "Experience ABRAM's conversational scoping engine. Interactively parse screenplays, optimize calendar schedules, resequence broadcast rundowns, and search crew talent.",
  keywords: [
    "abram",
    "screenplay parser",
    "stripboard schedule optimization",
    "broadcast rundown planner",
    "crew talent matchmaker",
    "abram intelligence",
    "workspace conversational ai"
  ],
  alternates: {
    canonical: "https://abram.network/intelligence/creative-copilot",
  },
  openGraph: {
    title: "ABRAM Playground — Interactive Studio AI | ABRAM Network",
    description: "Experience ABRAM's conversational scoping engine. Interactively parse screenplays, optimize calendar schedules, resequence broadcast rundowns, and search crew talent.",
    type: "website",
    url: "https://abram.network/intelligence/creative-copilot",
  },
  twitter: {
    card: "summary_large_image",
    title: "ABRAM Playground — Interactive Studio AI | ABRAM Network",
    description: "Experience ABRAM's conversational scoping engine. Interactively parse screenplays, optimize calendar schedules, resequence broadcast rundowns, and search crew talent.",
  },
};

export default function CreativeCopilotPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'ABRAM Dashboard & Playground',
    description: 'Conversational agent playground for screenplays, scheduling, and live rundowns.',
    url: 'https://abram.network/intelligence/creative-copilot',
    isPartOf: { '@id': 'https://abram.network/#website' },
    publisher: { '@id': 'https://abram.network/#organization' },
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'ABRAM',
      applicationCategory: 'BusinessApplication',
      featureList: [
        'AI Screenplay Metadata Parsing',
        'Stripboard Schedule Hold Day Optimization',
        'Dynamic Broadcast Rundown Resequencing',
        'Weighted Talent Suitability Matchmaking',
        'Structured Action Plan Confirmation Alerts',
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <CreativeCopilotClient />
    </>
  );
}
