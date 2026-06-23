import type { Metadata } from 'next';
import SmartSchedulingClient from './SmartSchedulingClient';

export const metadata: Metadata = {
  title: 'Smart Resource & Crew Scheduling | ABRAM Network',
  description: 'Coordinate physical resources and crew in an interactive timeline. Automatically resolve schedule overlaps, double bookings, and turnaround compliance issues.',
  keywords: [
    'resource scheduling timeline', 'conflict resolution calendar', 'crew scheduling',
    'union rest margin compliance', 'timeline allocations', 'scheduling dashboard'
  ],
  alternates: {
    canonical: 'https://abram.network/agency/smart-scheduling',
  },
  openGraph: {
    title: 'Smart Resource & Crew Scheduling | ABRAM Network',
    description: 'Coordinate physical resources and crew in an interactive timeline. Automatically resolve schedule overlaps, double bookings, and turnaround compliance issues.',
    type: 'website',
    url: 'https://abram.network/agency/smart-scheduling',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Resource & Crew Scheduling | ABRAM Network',
    description: 'Coordinate physical resources and crew in an interactive timeline. Automatically resolve schedule overlaps, double bookings, and turnaround compliance issues.',
  },
};

export default function SmartSchedulingPage() {
  return <SmartSchedulingClient />;
}
