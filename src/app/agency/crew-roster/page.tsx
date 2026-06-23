import type { Metadata } from 'next';
import CrewRosterClient from './CrewRosterClient';

export const metadata: Metadata = {
  title: 'Crew & Resource Roster Management | ABRAM Network',
  description: 'Manage high-availability crew rosters and production assets. Use our creative operations platform to coordinate team members, track equipment, and optimize project allocations.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'crew roster management', 'roster coordination', 'asset directory',
    'production staffing', 'crew availability calendar'
  ],
  alternates: {
    canonical: 'https://abram.network/agency/crew-roster',
  },
  openGraph: {
    title: 'Crew & Resource Roster Management | ABRAM Network',
    description: 'Manage high-availability crew rosters and production assets. Use our creative operations platform to coordinate team members, track equipment, and optimize project allocations.',
    type: 'website',
    url: 'https://abram.network/agency/crew-roster',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crew & Resource Roster Management | ABRAM Network',
    description: 'Manage high-availability crew rosters and production assets. Use our creative operations platform to coordinate team members, track equipment, and optimize project allocations.',
  },
};

export default function CrewRosterPage() {
  return <CrewRosterClient />;
}
