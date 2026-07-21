import type { Metadata } from 'next';
import CapacityPlanningClient from './CapacityPlanningClient';

export const metadata: Metadata = {
  title: 'Workload Balancer & Capacity Planning',
  description: 'See who is over-allocated and where work is unstaffed on a day-by-day team capacity grid, then rebalance planned hours before overload costs you a week.',
  keywords: [
    'capacity planning software', 'workload balancer', 'team capacity grid',
    'resource utilization', 'over-allocation tracking', 'unassigned work',
    'planned vs actual hours', 'creative operations platform', 'staffing capacity',
  ],
  alternates: {
    canonical: 'https://abram.network/agency/capacity-planning',
  },
  openGraph: {
    title: 'Workload Balancer & Capacity Planning | ABRAM Network',
    description: 'See who is over-allocated and where work is unstaffed on a day-by-day team capacity grid, then rebalance planned hours before overload costs you a week.',
    type: 'website',
    url: 'https://abram.network/agency/capacity-planning',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Workload Balancer & Capacity Planning | ABRAM Network',
    description: 'See who is over-allocated and where work is unstaffed on a day-by-day team capacity grid, then rebalance planned hours before overload costs you a week.',
  },
};

export default function CapacityPlanningPage() {
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
                '@id': 'https://abram.network/agency/capacity-planning/#webpage',
                'url': 'https://abram.network/agency/capacity-planning',
                'name': 'Workload Balancer & Capacity Planning | ABRAM Network',
                'description': 'See who is over-allocated and where work is unstaffed on a day-by-day team capacity grid, then rebalance planned hours.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/agency/capacity-planning/#breadcrumb',
                'itemListElement': [
                  { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://abram.network/' },
                  { '@type': 'ListItem', 'position': 2, 'name': 'Agency Operations', 'item': 'https://abram.network/agency' },
                  { '@type': 'ListItem', 'position': 3, 'name': 'Capacity Planning', 'item': 'https://abram.network/agency/capacity-planning' },
                ],
              },
            ],
          }).replace(/</g, '\\u003c'),
        }}
      />
      <CapacityPlanningClient />
    </>
  );
}
