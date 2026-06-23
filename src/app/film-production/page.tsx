import type { Metadata } from 'next';
import FilmProductionHubClient from './FilmProductionHubClient';

export const metadata: Metadata = {
  title: 'Film Production Suite — Dynamic Creative Operations',
  description: 'Streamline physical production. Analyze daily burn rates, coordinate crew turnaround safety margins, and break down screenplays with advanced parsing.',
  keywords: [
    'film production management', 'crew scheduling', 'production budgeting',
    'union rates estimator', 'freelancer invoicing', 'timeline allocations',
  ],
  alternates: {
    canonical: 'https://abram.network/film-production',
  },
};

export default function FilmProductionPage() {
  return <FilmProductionHubClient />;
}
