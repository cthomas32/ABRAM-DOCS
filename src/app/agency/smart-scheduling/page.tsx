import type { Metadata } from 'next';
import SmartSchedulingClient from './SmartSchedulingClient';

export const metadata: Metadata = {
  title: 'Smart Resource & Crew Scheduling',
  description: 'Coordinate equipment resources, location calendars, and crew schedules in an interactive timeline. Resolve scheduling conflicts and compliance using smart creative operations tools.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'resource scheduling timeline', 'conflict resolution calendar', 'crew scheduling',
    'union rest margin compliance', 'timeline allocations', 'scheduling dashboard'
  ],
  alternates: {
    canonical: 'https://abram.network/agency/smart-scheduling',
  },
  openGraph: {
    title: 'Smart Resource & Crew Scheduling | ABRAM Network',
    description: 'Coordinate equipment resources, location calendars, and crew schedules in an interactive timeline. Resolve scheduling conflicts and compliance using smart creative operations tools.',
    type: 'website',
    url: 'https://abram.network/agency/smart-scheduling',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Resource & Crew Scheduling | ABRAM Network',
    description: 'Coordinate equipment resources, location calendars, and crew schedules in an interactive timeline. Resolve scheduling conflicts and compliance using smart creative operations tools.',
  },
};

export default function SmartSchedulingPage() {
  return <SmartSchedulingClient />;
}
