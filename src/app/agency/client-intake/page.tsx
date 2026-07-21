import type { Metadata } from 'next';
import ClientIntakeClient from './ClientIntakeClient';

export const metadata: Metadata = {
  title: 'Client Request & Brief Intake Portal',
  description: 'Build custom project request forms and parse briefs using AI. Explore our creative operations platform to extract deliverables and estimate workloads.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'project request intake', 'brief intelligence', 'ai brief parsing',
    'custom client forms', 'scoping automated', 'brief scoping portal'
  ],
  alternates: {
    canonical: 'https://abram.network/agency/client-intake',
  },
  openGraph: {
    title: 'Client Request & Brief Intake Portal | ABRAM Network',
    description: 'Build custom project request forms and parse briefs using AI. Explore our creative operations platform to extract deliverables and estimate workloads.',
    type: 'website',
    url: 'https://abram.network/agency/client-intake',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Client Request & Brief Intake Portal | ABRAM Network',
    description: 'Build custom project request forms and parse briefs using AI. Explore our creative operations platform to extract deliverables and estimate workloads.',
  },
};

export default function ClientIntakePage() {
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
                '@id': 'https://abram.network/agency/client-intake/#webpage',
                'url': 'https://abram.network/agency/client-intake',
                'name': 'Client Request & Brief Intake Portal | ABRAM Network',
                'description': 'Build custom project request forms and parse briefs using AI.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/agency/client-intake/#breadcrumb',
                'itemListElement': [
                  { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://abram.network/' },
                  { '@type': 'ListItem', 'position': 2, 'name': 'Agency Operations', 'item': 'https://abram.network/agency' },
                  { '@type': 'ListItem', 'position': 3, 'name': 'Client Intake', 'item': 'https://abram.network/agency/client-intake' },
                ],
              },
            ],
          }).replace(/</g, '\\u003c'),
        }}
      />
      <ClientIntakeClient />
    </>
  );
}
