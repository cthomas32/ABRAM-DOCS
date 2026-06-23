import type { Metadata } from 'next';
import ScriptBreakdownClient from './ScriptBreakdownClient';

export const metadata: Metadata = {
  title: 'AI Script Breakdown & Screenplay Parsing | ABRAM Network',
  description: 'Transform screenplays into production-ready stripboards. Discover AI script breakdown and screenplay parsing tools inside ABRAM\'s creative operations platform.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'AI script breakdown', 'screenplay parsing', 'automated stripboard', 
    'shoot optimization', 'film pre-production', 'script tagging', 'ABRAM Network'
  ],
  alternates: {
    canonical: 'https://abram.network/film-production/script-breakdown',
  },
  openGraph: {
    title: 'AI Script Breakdown & Screenplay Parsing | ABRAM Network',
    description: 'Transform screenplays into production-ready stripboards in seconds with AI tools built on the ABRAM creative operations platform.',
    type: 'website',
    url: 'https://abram.network/film-production/script-breakdown',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Script Breakdown & Screenplay Parsing | ABRAM Network',
    description: 'Transform screenplays into production-ready stripboards in seconds with AI tools built on the ABRAM creative operations platform.',
  },
};

export default function ScriptBreakdownPage() {
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
                '@id': 'https://abram.network/film-production/script-breakdown#webpage',
                'name': 'AI Script Breakdown & Screenplay Parsing | ABRAM Network',
                'description': 'Automated screenplay parsing and scheduling breakdown tools inside the ABRAM Network platform.',
                'url': 'https://abram.network/film-production/script-breakdown',
                'isPartOf': { '@id': 'https://abram.network/#website' },
                'publisher': { '@id': 'https://abram.network/#organization' },
                'mainEntity': {
                  '@type': 'SoftwareApplication',
                  'name': 'ABRAM Script Breakdown',
                  'applicationCategory': 'BusinessApplication',
                  'featureList': [
                    'Instant Screenplay Parsing',
                    'Automatic Location-based Optimization',
                    'Character & Prop Tag Extraction',
                    'Sleek Stripboard Timeline Rendering',
                    'Dynamic Scheduling Updates',
                  ],
                },
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/film-production/script-breakdown#breadcrumb',
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
                    'name': 'Script Breakdown',
                    'item': 'https://abram.network/film-production/script-breakdown'
                  }
                ]
              }
            ]
          }).replace(/</g, '\\u003c'),
        }}
      />
      <ScriptBreakdownClient />
    </>
  );
}
