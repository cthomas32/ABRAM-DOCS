import type { Metadata } from 'next';
import CallSheetsClient from './CallSheetsClient';

export const metadata: Metadata = {
  title: 'Digital Call Sheets — High-Fidelity Call Board',
  description: 'Manage shooting schedules, basecamp contacts, and turnaround safety margins in real-time with our advanced creative production software and digital call sheets.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'digital call sheets', 'film call board', 'shooting schedules',
    'turnaround compliance safety', 'crew coordination', 'film basecamp weather'
  ],
  alternates: {
    canonical: 'https://abram.network/film-production/call-sheets',
  },
  openGraph: {
    title: 'Digital Call Sheets — High-Fidelity Call Board | ABRAM Network',
    description: 'Manage shooting schedules, weather forecasting, basecamp contacts, and crew turnaround safety margins with digital call sheets built on ABRAM\'s creative operations platform.',
    type: 'website',
    url: 'https://abram.network/film-production/call-sheets',
    siteName: 'ABRAM Network',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digital Call Sheets — High-Fidelity Call Board',
    description: 'Manage shooting schedules, weather forecasting, basecamp contacts, and crew turnaround safety margins with digital call sheets built on ABRAM\'s creative operations platform.',
  },
};

export default function CallSheetsPage() {
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
                '@id': 'https://abram.network/film-production/call-sheets#webpage',
                'url': 'https://abram.network/film-production/call-sheets',
                'name': 'Digital Call Sheets — High-Fidelity Call Board',
                'description': 'Manage shooting schedules, weather forecasting, emergency basecamp contacts, crew turnaround safety margins, and active crew notifications in real-time.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
                'publisher': { '@id': 'https://abram.network/#organization' }
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/film-production/call-sheets#breadcrumb',
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
                    'name': 'Film Production',
                    'item': 'https://abram.network/film-production'
                  },
                  {
                    '@type': 'ListItem',
                    'position': 3,
                    'name': 'Digital Call Sheets',
                    'item': 'https://abram.network/film-production/call-sheets'
                  }
                ]
              }
            ]
          }).replace(/</g, '\\u003c'),
        }}
      />
      <CallSheetsClient />
    </>
  );
}
