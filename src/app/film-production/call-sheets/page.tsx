import type { Metadata } from 'next';
import CallSheetsClient from './CallSheetsClient';

export const metadata: Metadata = {
  title: 'Digital Call Sheets — High-Fidelity Call Board',
  description: 'Manage shooting schedules, weather forecasting, emergency basecamp contacts, crew turnaround safety margins, and active crew notifications in real-time.',
  keywords: [
    'digital call sheets', 'film call board', 'shooting schedules',
    'turnaround compliance safety', 'crew coordination', 'film basecamp weather'
  ],
  alternates: {
    canonical: 'https://abram.network/film-production/call-sheets',
  },
  openGraph: {
    title: 'Digital Call Sheets — High-Fidelity Call Board | ABRAM Network',
    description: 'Manage shooting schedules, weather forecasting, emergency basecamp contacts, and turnaround safety margins in real-time.',
    type: 'website',
    url: 'https://abram.network/film-production/call-sheets',
    siteName: 'ABRAM Network',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digital Call Sheets — High-Fidelity Call Board',
    description: 'Manage shooting schedules, weather forecasting, emergency basecamp contacts, and turnaround safety margins in real-time.',
  },
};

export default function CallSheetsPage() {
  return <CallSheetsClient />;
}
