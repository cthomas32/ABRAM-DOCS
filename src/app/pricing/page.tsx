import type { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Explore ABRAM pricing plans for freelancers, teams, and creative agencies. Start free with AI-powered production management, crew scheduling, and automated invoicing.',
  keywords: [
    'ABRAM pricing', 'creative production pricing', 'freelancer tools pricing',
    'crew management software cost', 'production management plans',
    'AI production tools', 'SaaS pricing', 'free tier',
  ],
  alternates: {
    canonical: 'https://docs.abram.network/pricing',
  },
  openGraph: {
    title: 'ABRAM Pricing — Plans for Every Creative Team',
    description: 'Start free with AI-powered production management. Plans for freelancers, teams, and agencies.',
    type: 'website',
    url: 'https://docs.abram.network/pricing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ABRAM Pricing — Plans for Every Creative Team',
    description: 'Start free with AI-powered production management. Plans for freelancers, teams, and agencies.',
  },
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'ABRAM Pricing',
            description: 'Pricing plans for the ABRAM creative production platform.',
            url: 'https://docs.abram.network/pricing',
            isPartOf: { '@id': 'https://docs.abram.network/#website' },
            publisher: { '@id': 'https://abram.network/#organization' },
            mainEntity: {
              '@type': 'SoftwareApplication',
              name: 'ABRAM',
              applicationCategory: 'BusinessApplication',
              offers: {
                '@type': 'AggregateOffer',
                lowPrice: '0',
                priceCurrency: 'USD',
                offerCount: 3,
              },
            },
          }).replace(/</g, '\\u003c'),
        }}
      />
      <PricingClient />
    </>
  );
}
