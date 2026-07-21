import type { Metadata } from 'next';
import CrewRosterClient from './CrewRosterClient';

export const metadata: Metadata = {
  title: 'Crew & Resource Roster Management',
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
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebPage',
                '@id': 'https://abram.network/agency/crew-roster/#webpage',
                'url': 'https://abram.network/agency/crew-roster',
                'name': 'Crew & Resource Roster Management | ABRAM Network',
                'description': 'Manage high-availability crew rosters and production assets.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/agency/crew-roster/#breadcrumb',
                'itemListElement': [
                  { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://abram.network/' },
                  { '@type': 'ListItem', 'position': 2, 'name': 'Agency Operations', 'item': 'https://abram.network/agency' },
                  { '@type': 'ListItem', 'position': 3, 'name': 'Crew Roster', 'item': 'https://abram.network/agency/crew-roster' },
                ],
              },
            ],
          }).replace(/</g, '\\u003c'),
        }}
      />
      <CrewRosterClient />
    </>
  );
}
