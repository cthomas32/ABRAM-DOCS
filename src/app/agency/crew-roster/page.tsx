import type { Metadata } from 'next';
import CrewRosterClient from './CrewRosterClient';

export const metadata: Metadata = {
  title: 'Crew & Assets Roster Optimization | ABRAM Network',
  description: 'Maintain a high-availability directory of designers, editors, copywriters, and physical stages. Match the perfect crew using weighted suitability scores.',
  keywords: [
    'crew roster management', 'suitability score matching', 'asset directory',
    'agency staffing', 'ai crewing', 'contractor availability calendar'
  ],
  alternates: {
    canonical: 'https://abram.network/agency/crew-roster',
  },
  openGraph: {
    title: 'Crew & Assets Roster Optimization | ABRAM Network',
    description: 'Maintain a high-availability directory of designers, editors, copywriters, and physical stages. Match the perfect crew using weighted suitability scores.',
    type: 'website',
    url: 'https://abram.network/agency/crew-roster',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crew & Assets Roster Optimization | ABRAM Network',
    description: 'Maintain a high-availability directory of designers, editors, copywriters, and physical stages. Match the perfect crew using weighted suitability scores.',
  },
};

export default function CrewRosterPage() {
  return <CrewRosterClient />;
}
