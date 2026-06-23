import type { Metadata } from 'next';
import ScriptBreakdownClient from './ScriptBreakdownClient';

export const metadata: Metadata = {
  title: 'AI Script Breakdown — Automated Screenplay Parsing | ABRAM Network',
  description: 'Transform screenplays into production-ready stripboards in seconds. Automatically parse scenes, extract characters, and compile scheduling elements.',
  keywords: [
    'AI script breakdown', 'screenplay parsing', 'automated stripboard', 
    'shoot optimization', 'film pre-production', 'script tagging', 'ABRAM Network'
  ],
  alternates: {
    canonical: 'https://abram.network/film-production/script-breakdown',
  },
  openGraph: {
    title: 'AI Script Breakdown — Automated Screenplay Parsing | ABRAM Network',
    description: 'Transform screenplays into production-ready stripboards in seconds.',
    type: 'website',
    url: 'https://abram.network/film-production/script-breakdown',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Script Breakdown — Automated Screenplay Parsing | ABRAM Network',
    description: 'Transform screenplays into production-ready stripboards in seconds.',
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
            '@type': 'WebPage',
            name: 'AI Script Breakdown — Automated Screenplay Parsing',
            description: 'Automated screenplay parsing and scheduling breakdown tools inside the ABRAM Network platform.',
            url: 'https://abram.network/film-production/script-breakdown',
            isPartOf: { '@id': 'https://abram.network/#website' },
            publisher: { '@id': 'https://abram.network/#organization' },
            mainEntity: {
              '@type': 'SoftwareApplication',
              name: 'ABRAM Script Breakdown',
              applicationCategory: 'BusinessApplication',
              featureList: [
                'Instant Screenplay Parsing',
                'Automatic Location-based Optimization',
                'Character & Prop Tag Extraction',
                'Sleek Stripboard Timeline Rendering',
                'Dynamic Scheduling Updates',
              ],
            },
          }).replace(/</g, '\\u003c'),
        }}
      />
      <ScriptBreakdownClient />
    </>
  );
}
