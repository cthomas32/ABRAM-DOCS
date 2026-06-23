import type { Metadata } from 'next';
import IntelligenceHubClient from '@/app/intelligence/IntelligenceHubClient';

export const metadata: Metadata = {
  title: 'Roster Intelligence Hub — Dynamic ROI Calculation | ABRAM Network',
  description: 'Measure the yield of your operations. Quantify time and labor savings, prevent resource leakage, and model your ROI with our interactive calculator.',
  keywords: [
    'roster intelligence', 'ROI calculator', 'studio efficiency', 'crew automation rate',
    'operational savings', 'leakage prevention', 'payback period', 'workspace intelligence'
  ],
  alternates: {
    canonical: 'https://abram.network/intelligence',
  },
  openGraph: {
    title: 'Roster Intelligence Hub — Dynamic ROI Calculation | ABRAM Network',
    description: 'Measure the yield of your operations. Quantify time and labor savings, prevent resource leakage, and model your ROI with our interactive calculator.',
    type: 'website',
    url: 'https://abram.network/intelligence',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roster Intelligence Hub — Dynamic ROI Calculation | ABRAM Network',
    description: 'Measure the yield of your operations. Quantify time and labor savings, prevent resource leakage, and model your ROI with our interactive calculator.',
  },
};

export default function IntelligenceHubPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'ABRAM Roster Intelligence Hub',
    description: 'Quantify operational efficiency and model return on investment with our interactive ROI Calculator.',
    url: 'https://abram.network/intelligence',
    isPartOf: { '@id': 'https://abram.network/#website' },
    publisher: { '@id': 'https://abram.network/#organization' },
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'ABRAM Roster Intelligence',
      applicationCategory: 'BusinessApplication',
      featureList: [
        'Interactive Roster ROI Calculator',
        'Administrative Labor Savings Modeler',
        'Operational Leakage Prevention Estimator',
        'Linear Boutique, Mid-Market, and Enterprise Scenarios',
        'Payback Period Analysis',
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <IntelligenceHubClient />
    </>
  );
}
