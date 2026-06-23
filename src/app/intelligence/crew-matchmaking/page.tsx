import type { Metadata } from 'next';
import CrewMatchmakingClient from './CrewMatchmakingClient';

export const metadata: Metadata = {
  title: 'Crew Matchmaking Engine & Suitability Scoring | ABRAM Network',
  description: 'Match crew members to project slots using our Suitability Matrix. Verify availability and schedule holds in our creative operations platform.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'crew matchmaking', 'suitability index matrix', 'talent match scoring',
    'capacity synchronization hold', 'freelancer booking availability', 'abram network'
  ],
  alternates: {
    canonical: 'https://abram.network/intelligence/crew-matchmaking',
  },
  openGraph: {
    title: 'Crew Matchmaking Engine & Suitability Scoring | ABRAM Network',
    description: 'Match crew members to project slots using our Suitability Matrix. Verify availability and schedule holds in our creative operations platform.',
    type: 'website',
    url: 'https://abram.network/intelligence/crew-matchmaking',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crew Matchmaking Engine & Suitability Scoring | ABRAM Network',
    description: 'Match crew members to project slots using our Suitability Matrix. Verify availability and schedule holds in our creative operations platform.',
  },
};

export default function CrewMatchmakingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://abram.network/intelligence/crew-matchmaking#webpage',
        'name': 'ABRAM Crew Matchmaking Sandbox',
        'description': 'AI-powered crew matchmaking, suitability index scoring, and capacity synchronization checks in the ABRAM creative production platform.',
        'url': 'https://abram.network/intelligence/crew-matchmaking',
        'isPartOf': { '@id': 'https://abram.network/#website' },
        'publisher': { '@id': 'https://abram.network/#organization' },
        'mainEntity': {
          '@type': 'SoftwareApplication',
          'name': 'ABRAM Crew Matchmaking',
          'applicationCategory': 'BusinessApplication',
          'featureList': [
            '100-Point Suitability Index Matrix',
            '3.8x Match Speed Processing',
            'Live Capacity Synchronization Hold',
            'Roster Schedule Overlay Analysis',
          ],
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://abram.network/intelligence/crew-matchmaking#breadcrumb',
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
            'name': 'Crew Matchmaking',
            'item': 'https://abram.network/intelligence/crew-matchmaking'
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
      <CrewMatchmakingClient />
    </>
  );
}
