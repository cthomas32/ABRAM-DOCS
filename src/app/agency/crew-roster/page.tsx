import type { Metadata } from 'next';
import CrewRosterClient from './CrewRosterClient';

export const metadata: Metadata = {
  title: 'Crew & Assets Roster Optimization | ABRAM Network',
  description: 'Maintain a high-availability crew roster and asset directory. Use our creative operations platform to match talent using weighted suitability scores.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'crew roster management', 'suitability score matching', 'asset directory',
    'agency staffing', 'ai crewing', 'contractor availability calendar'
  ],
  alternates: {
    canonical: 'https://abram.network/agency/crew-roster',
  },
  openGraph: {
    title: 'Crew & Assets Roster Optimization | ABRAM Network',
    description: 'Maintain a high-availability crew roster and asset directory. Use our creative operations platform to match talent using weighted suitability scores.',
    type: 'website',
    url: 'https://abram.network/agency/crew-roster',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crew & Assets Roster Optimization | ABRAM Network',
    description: 'Maintain a high-availability crew roster and asset directory. Use our creative operations platform to match talent using weighted suitability scores.',
  },
};

export default function CrewRosterPage() {
  return <CrewRosterClient />;
}
