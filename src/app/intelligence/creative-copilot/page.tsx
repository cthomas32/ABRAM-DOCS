import type { Metadata } from "next";
import CreativeCopilotClient from "@/app/intelligence/creative-copilot/CreativeCopilotClient";

export const metadata: Metadata = {
  title: "ABRAM Playground & Studio AI",
  description: "Experience ABRAM's conversational scoping engine inside our creative production software. Parse screenplays and search crew in real-time.",
  keywords: [
    "creative production software",
    "creative production tools",
    "creative operations platform",
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
    title: "ABRAM Playground & Studio AI | ABRAM Network",
    description: "Experience ABRAM's conversational scoping engine inside our creative production software. Parse screenplays and search crew in real-time.",
    type: "website",
    url: "https://abram.network/intelligence/creative-copilot",
  },
  twitter: {
    card: "summary_large_image",
    title: "ABRAM Playground & Studio AI | ABRAM Network",
    description: "Experience ABRAM's conversational scoping engine inside our creative production software. Parse screenplays and search crew in real-time.",
  },
};

export default function CreativeCopilotPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://abram.network/intelligence/creative-copilot#webpage',
        'name': 'ABRAM Dashboard & Playground',
        'description': 'Conversational agent playground for screenplays, scheduling, and live rundowns.',
        'url': 'https://abram.network/intelligence/creative-copilot',
        'isPartOf': { '@id': 'https://abram.network/#website' },
        'publisher': { '@id': 'https://abram.network/#organization' },
        'mainEntity': {
          '@type': 'SoftwareApplication',
          'name': 'ABRAM',
          'applicationCategory': 'BusinessApplication',
          'featureList': [
            'AI Screenplay Metadata Parsing',
            'Stripboard Schedule Hold Day Optimization',
            'Dynamic Broadcast Rundown Resequencing',
            'Weighted Talent Suitability Matchmaking',
            'Structured Action Plan Confirmation Alerts',
          ],
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://abram.network/intelligence/creative-copilot#breadcrumb',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'https://abram.network/'
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'AI Intelligence',
            'item': 'https://abram.network/intelligence'
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': 'Creative Copilot',
            'item': 'https://abram.network/intelligence/creative-copilot'
          }
        ]
      }
    ]
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
