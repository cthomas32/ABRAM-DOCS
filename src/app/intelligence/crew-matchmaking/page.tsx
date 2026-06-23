import type { Metadata } from 'next';
import CrewMatchmakingClient from './CrewMatchmakingClient';

export const metadata: Metadata = {
  title: 'Crew Matchmaking Engine & Suitability Scoring | ABRAM Network',
  description: 'Match crew members to project slots using our weighted Suitability Matrix. Verify availability schedules and coordinate project capacity holds in real-time.',
  keywords: [
    'crew matchmaking', 'suitability index matrix', 'talent match scoring',
    'capacity synchronization hold', 'freelancer booking availability', 'abram network'
  ],
  alternates: {
    canonical: 'https://abram.network/intelligence/crew-matchmaking',
  },
  openGraph: {
    title: 'Crew Matchmaking Engine & Suitability Scoring | ABRAM Network',
    description: 'Match crew members to project slots using our weighted Suitability Matrix. Verify availability schedules and coordinate project capacity holds in real-time.',
    type: 'website',
    url: 'https://abram.network/intelligence/crew-matchmaking',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crew Matchmaking Engine & Suitability Scoring | ABRAM Network',
    description: 'Match crew members to project slots using our weighted Suitability Matrix. Verify availability schedules and coordinate project capacity holds in real-time.',
  },
};

export default function CrewMatchmakingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'ABRAM Crew Matchmaking Sandbox',
    description: 'AI-powered crew matchmaking, suitability index scoring, and capacity synchronization checks in the ABRAM creative production platform.',
    url: 'https://abram.network/intelligence/crew-matchmaking',
    isPartOf: { '@id': 'https://abram.network/#website' },
    publisher: { '@id': 'https://abram.network/#organization' },
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'ABRAM Crew Matchmaking',
      applicationCategory: 'BusinessApplication',
      featureList: [
        '100-Point Suitability Index Matrix',
        '3.8x Match Speed Processing',
        'Live Capacity Synchronization Hold',
        'Roster Schedule Overlay Analysis',
      ],
    },
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
