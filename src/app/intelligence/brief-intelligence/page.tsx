import type { Metadata } from 'next';
import BriefIntelligenceClient from './BriefIntelligenceClient';

export const metadata: Metadata = {
  title: 'Brief Intelligence & AI Scoping | ABRAM Network',
  description: 'Upload a brief to generate Work Packages, extract tasks, and resolve ambiguities using advanced AI creative production tools.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'brief intelligence', 'ai brief analyzer', 'scoping software',
    'creative production brief', 'work package generator', 'abram network'
  ],
  alternates: {
    canonical: 'https://abram.network/intelligence/brief-intelligence',
  },
  openGraph: {
    title: 'Brief Intelligence & AI Scoping | ABRAM Network',
    description: 'Upload a brief to generate Work Packages, extract tasks, and resolve ambiguities using advanced AI creative production tools.',
    type: 'website',
    url: 'https://abram.network/intelligence/brief-intelligence',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brief Intelligence & AI Scoping | ABRAM Network',
    description: 'Upload a brief to generate Work Packages, extract tasks, and resolve ambiguities using advanced AI creative production tools.',
  },
};

export default function BriefIntelligencePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://abram.network/intelligence/brief-intelligence#webpage',
        'name': 'ABRAM Brief Intelligence Sandbox',
        'description': 'AI-powered creative brief scoping, automatic Work Packages generation, and deliverable parsing in the ABRAM creative production platform.',
        'url': 'https://abram.network/intelligence/brief-intelligence',
        'isPartOf': { '@id': 'https://abram.network/#website' },
        'publisher': { '@id': 'https://abram.network/#organization' },
        'mainEntity': {
          '@type': 'SoftwareApplication',
          'name': 'ABRAM Brief Intelligence',
          'applicationCategory': 'BusinessApplication',
          'featureList': [
            'AI Brief Intelligence',
            'Interactive Work Packages',
            'Project Scoping Confidence Index',
            'Clarifying Gap Analysis',
          ],
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://abram.network/intelligence/brief-intelligence#breadcrumb',
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
            'name': 'AI Intelligence',
            'item': 'https://abram.network/intelligence'
          },
          {
            '@type': 'ListItem',
            'position': 3,
            'name': 'Brief Intelligence',
            'item': 'https://abram.network/intelligence/brief-intelligence'
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <BriefIntelligenceClient />
    </>
  );
}
