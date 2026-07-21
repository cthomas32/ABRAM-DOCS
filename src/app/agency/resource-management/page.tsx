import type { Metadata } from 'next';
import ResourceManagementClient from './ResourceManagementClient';

export const metadata: Metadata = {
  title: 'Equipment & Resource Management',
  description: 'Track gear, studios, and locations in one inventory hub. Book equipment with quantity-aware conflict detection, reusable kits, and utilization analytics.',
  keywords: [
    'creative production software', 'equipment management software', 'gear inventory tracking',
    'studio booking calendar', 'resource management platform', 'equipment scheduling',
    'asset utilization analytics', 'barcode gear check-out'
  ],
  alternates: {
    canonical: 'https://abram.network/agency/resource-management',
  },
  openGraph: {
    title: 'Equipment & Resource Management | ABRAM Network',
    description: 'Track gear, studios, and locations in one inventory hub. Book equipment with quantity-aware conflict detection, reusable kits, and utilization analytics.',
    type: 'website',
    url: 'https://abram.network/agency/resource-management',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Equipment & Resource Management | ABRAM Network',
    description: 'Track gear, studios, and locations in one inventory hub. Book equipment with quantity-aware conflict detection, reusable kits, and utilization analytics.',
  },
};

export default function ResourceManagementPage() {
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
                '@id': 'https://abram.network/agency/resource-management/#webpage',
                'url': 'https://abram.network/agency/resource-management',
                'name': 'Equipment & Resource Management | ABRAM Network',
                'description': 'Track gear, studios, and locations in one inventory hub.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/agency/resource-management/#breadcrumb',
                'itemListElement': [
                  { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://abram.network/' },
                  { '@type': 'ListItem', 'position': 2, 'name': 'Agency Operations', 'item': 'https://abram.network/agency' },
                  { '@type': 'ListItem', 'position': 3, 'name': 'Resource Management', 'item': 'https://abram.network/agency/resource-management' },
                ],
              },
            ],
          }).replace(/</g, '\\u003c'),
        }}
      />
      <ResourceManagementClient />
    </>
  );
}
