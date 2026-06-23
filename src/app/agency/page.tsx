import type { Metadata } from 'next';
import AgencyHubClient from '@/app/agency/AgencyHubClient';

export const metadata: Metadata = {
  title: 'Creative Operations Hub — Unified Studio Management | ABRAM Network',
  description: 'Scale agency and studio workflows in a unified environment. Automate project brief requests, optimize crew composition, and streamline smart scheduling.',
  keywords: [
    'creative operations', 'agency management software', 'studio logistics',
    'crew roster matching', 'brief intelligence', 'scheduling tool', 'workspace intelligence'
  ],
  alternates: {
    canonical: 'https://abram.network/agency',
  },
  openGraph: {
    title: 'Creative Operations Hub — Unified Studio Management | ABRAM Network',
    description: 'Scale agency and studio workflows in a unified environment. Automate project brief requests, optimize crew composition, and streamline smart scheduling.',
    type: 'website',
    url: 'https://abram.network/agency',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creative Operations Hub — Unified Studio Management | ABRAM Network',
    description: 'Scale agency and studio workflows in a unified environment. Automate project brief requests, optimize crew composition, and streamline smart scheduling.',
  },
};

export default function AgencyHubPage() {
  return <AgencyHubClient />;
}
