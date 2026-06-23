import type { Metadata } from 'next';
import BriefIntelligenceClient from './BriefIntelligenceClient';

export const metadata: Metadata = {
  title: 'Brief Intelligence & AI Scoping | ABRAM Network',
  description: 'Upload a brief to automatically generate Work Packages, extract task lists, and refine ambiguities before crew assignment.',
  keywords: [
    'brief intelligence', 'ai brief analyzer', 'scoping software',
    'creative production brief', 'work package generator', 'brief intelligence', 'abram network'
  ],
  alternates: {
    canonical: 'https://abram.network/intelligence/brief-intelligence',
  },
  openGraph: {
    title: 'Brief Intelligence & AI Scoping | ABRAM Network',
    description: 'Upload a brief to automatically generate Work Packages, extract task lists, and refine ambiguities before crew assignment.',
    type: 'website',
    url: 'https://abram.network/intelligence/brief-intelligence',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brief Intelligence & AI Scoping | ABRAM Network',
    description: 'Upload a brief to automatically generate Work Packages, extract task lists, and refine ambiguities before crew assignment.',
  },
};

export default function BriefIntelligencePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'ABRAM Brief Intelligence Sandbox',
    description: 'AI-powered creative brief scoping, automatic Work Packages generation, and deliverable parsing in the ABRAM creative production platform.',
    url: 'https://abram.network/intelligence/brief-intelligence',
    isPartOf: { '@id': 'https://abram.network/#website' },
    publisher: { '@id': 'https://abram.network/#organization' },
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'ABRAM Brief Intelligence',
      applicationCategory: 'BusinessApplication',
      featureList: [
        'AI Brief Intelligence',
        'Interactive Work Packages',
        'Project Scoping Confidence Index',
        'Clarifying Gap Analysis',
      ],
    },
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
