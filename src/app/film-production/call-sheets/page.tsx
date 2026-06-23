import type { Metadata } from 'next';
import CallSheetsClient from './CallSheetsClient';

export const metadata: Metadata = {
  title: 'Digital Call Sheets — High-Fidelity Call Board',
  description: 'Manage shooting schedules, weather forecasting, emergency basecamp contacts, crew turnaround safety margins, and active crew notifications in real-time.',
  alternates: {
    canonical: 'https://abram.network/film-production/call-sheets',
  },
};

export default function CallSheetsPage() {
  return <CallSheetsClient />;
}
