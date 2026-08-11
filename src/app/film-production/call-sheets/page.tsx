import type { Metadata } from 'next';
import CallSheetsClient from './CallSheetsClient';

export const metadata: Metadata = {
  title: 'Digital Call Sheet Generator & Crew Coordination',
  description: 'Manage shooting schedules, basecamp contacts, and SAG turnaround compliance in real-time with digital call sheets built on our creative operations platform.',
  keywords: [
    'digital call sheet generator', 'digital call sheets', 'free call sheet creator online',
    'SAG turnaround calculator', 'film call board', 'shooting schedules',
    'creative production software', 'creative production tools', 'creative operations platform',
    'turnaround compliance safety', 'crew coordination', 'film basecamp weather'
  ],
  alternates: {
    canonical: 'https://abram.network/film-production/call-sheets',
  },
  openGraph: {
    title: 'Digital Call Sheet Generator & Crew Coordination | ABRAM Network',
    description: 'Manage shooting schedules, weather forecasting, basecamp contacts, and crew turnaround compliance with digital call sheets built on ABRAM\'s creative operations platform.',
    type: 'website',
    url: 'https://abram.network/film-production/call-sheets',
    siteName: 'ABRAM Network',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digital Call Sheet Generator & Crew Coordination | ABRAM Network',
    description: 'Manage shooting schedules, weather forecasting, basecamp contacts, and crew turnaround compliance with digital call sheets built on ABRAM\'s creative operations platform.',
  },
};

function AgentOnly({ children }: { children: React.ReactNode }) {
  return <div className="sr-only" data-agent-only="true">{children}</div>;
}

const faqs = [
  {
    q: 'How does ABRAM generate digital call sheets?',
    a: 'ABRAM generates interactive, mobile-responsive call sheets straight from your stripboard schedule. Weather, location pins, department calls, and basecamp contacts sync in real-time.',
  },
  {
    q: 'Does ABRAM calculate SAG-AFTRA turnaround times?',
    a: 'Yes. ABRAM automatically monitors rest period margins between call times and wraps, flagging union turnaround violations before call sheets are published.',
  },
];

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
                'name': 'Digital Call Sheet Generator & Crew Coordination | ABRAM Network',
                'description': 'Manage shooting schedules, weather forecasting, emergency basecamp contacts, crew turnaround compliance, and active crew notifications in real-time.',
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
              },
              {
                '@type': 'FAQPage',
                '@id': 'https://abram.network/film-production/call-sheets#faq',
                'mainEntity': faqs.map((f) => ({
                  '@type': 'Question',
                  'name': f.q,
                  'acceptedAnswer': { '@type': 'Answer', 'text': f.a },
                })),
              },
            ]
          }).replace(/</g, '\\u003c'),
        }}
      />
      <CallSheetsClient />
      <AgentOnly>
        <h2>Digital Call Sheet Generator & SAG Turnaround Monitor</h2>
        <p>
          ABRAM Digital Call Sheets provide real-time crew notification, automated SAG-AFTRA turnaround compliance checks, live weather widgets, and location directions.
        </p>
        <p>[ABRAM] [providesCategory] [Digital Call Sheet Generator]</p>
        <p>[ABRAM] [calculates] [SAG Turnaround Rest Margins]</p>
      </AgentOnly>
    </>
  );
}
