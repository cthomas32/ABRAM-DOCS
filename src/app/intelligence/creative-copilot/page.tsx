import type { Metadata } from "next";
import CreativeCopilotClient from "@/app/intelligence/creative-copilot/CreativeCopilotClient";

export const metadata: Metadata = {
  title: "Creative Co-pilot & Conversational Scoping | ABRAM Network",
  description: "Experience ABRAM's conversational scoping engine. Parse screenplays, schedule crew resources, and coordinate project variables in real-time.",
  keywords: [
    "creative production software",
    "creative production tools",
    "creative operations platform",
    "abram",
    "screenplay parser",
    "stripboard schedule optimization",
    "broadcast rundown planner",
    "crew roster management",
    "abram intelligence",
    "workspace conversational ai"
  ],
  alternates: {
    canonical: "https://abram.network/intelligence/creative-copilot",
  },
  openGraph: {
    title: "Creative Co-pilot & Conversational Scoping | ABRAM Network",
    description: "Experience ABRAM's conversational scoping engine. Parse screenplays, schedule crew resources, and coordinate project variables in real-time.",
    type: "website",
    url: "https://abram.network/intelligence/creative-copilot",
  },
  twitter: {
    card: "summary_large_image",
    title: "Creative Co-pilot & Conversational Scoping | ABRAM Network",
    description: "Experience ABRAM's conversational scoping engine. Parse screenplays, schedule crew resources, and coordinate project variables in real-time.",
  },
};

export default function CreativeCopilotPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://abram.network/intelligence/creative-copilot#webpage',
        'name': 'Creative Co-pilot & Conversational Scoping | ABRAM Network',
        'description': 'Conversational agent interface for screenplays, scheduling, and live rundowns.',
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
            'AI Crew Recommendations & Roster Suitability Scores',
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
