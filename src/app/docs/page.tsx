import type { Metadata } from 'next';
import DocsHubClient from './DocsHubClient';

export const metadata: Metadata = {
  title: 'Documentation Hub',
  description: 'Browse the complete ABRAM documentation — setup guides, AI features, crew management, invoicing, integrations, and troubleshooting for the creative production platform.',
  keywords: [
    'ABRAM documentation', 'help center', 'user guides', 'creative production',
    'AI brief analyzer', 'crew scheduling', 'talent matchmaking', 'invoicing',
    'project management', 'freelancer tools', 'production management',
  ],
  alternates: {
    canonical: 'https://abram.network/docs',
  },
  openGraph: {
    title: 'ABRAM Documentation Hub',
    description: 'Browse the complete ABRAM documentation — setup guides, AI features, crew management, invoicing, integrations, and troubleshooting.',
    type: 'website',
    url: 'https://abram.network/docs',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ABRAM Documentation Hub',
    description: 'Browse the complete ABRAM documentation — setup guides, AI features, crew management, invoicing, and integrations.',
  },
};

export default function DocsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'ABRAM Documentation',
            description: 'Complete documentation and help center for the ABRAM creative production platform.',
            url: 'https://abram.network/docs',
            isPartOf: { '@id': 'https://abram.network/#website' },
            publisher: { '@id': 'https://abram.network/#organization' },
          }).replace(/</g, '\\u003c'),
        }}
      />
      <DocsHubClient />
    </>
  );
}
