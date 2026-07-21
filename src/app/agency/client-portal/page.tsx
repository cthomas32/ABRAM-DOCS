import type { Metadata } from 'next';
import ClientPortalClient from './ClientPortalClient';

export const metadata: Metadata = {
  title: 'Client Portal & Secure Branded Dashboards',
  description: 'Provide secure client portals to view active campaign statuses, approve digital deliverables, discuss feedback in threads, and pay invoices via Stripe.',
  keywords: [
    'creative production software', 'creative operations platform', 'client portal software',
    'branded client dashboard', 'deliverable approvals', 'real-time project sync',
    'secure links no accounts', 'agency billing stripe'
  ],
  alternates: {
    canonical: 'https://abram.network/agency/client-portal',
  },
  openGraph: {
    title: 'Client Portal & Secure Branded Dashboards | ABRAM Network',
    description: 'Provide secure client portals to view active campaign statuses, approve digital deliverables, discuss feedback in threads, and pay invoices via Stripe.',
    type: 'website',
    url: 'https://abram.network/agency/client-portal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Client Portal & Secure Branded Dashboards | ABRAM Network',
    description: 'Provide secure client portals to view active campaign statuses, approve digital deliverables, discuss feedback in threads, and pay invoices via Stripe.',
  },
};

export default function ClientPortalPage() {
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
                '@id': 'https://abram.network/agency/client-portal/#webpage',
                'url': 'https://abram.network/agency/client-portal',
                'name': 'Client Portal & Secure Branded Dashboards | ABRAM Network',
                'description': 'Provide secure client portals to view active campaign statuses, approve digital deliverables, and pay invoices.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/agency/client-portal/#breadcrumb',
                'itemListElement': [
                  { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://abram.network/' },
                  { '@type': 'ListItem', 'position': 2, 'name': 'Agency Operations', 'item': 'https://abram.network/agency' },
                  { '@type': 'ListItem', 'position': 3, 'name': 'Client Portal', 'item': 'https://abram.network/agency/client-portal' },
                ],
              },
            ],
          }).replace(/</g, '\\u003c'),
        }}
      />
      <ClientPortalClient />
    </>
  );
}
