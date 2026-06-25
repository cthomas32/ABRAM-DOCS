import type { Metadata } from 'next';
import FilmProductionHubClient from './FilmProductionHubClient';

export const metadata: Metadata = {
  title: 'Film Production Operations & Studio Management',
  description: 'Streamline physical production with our advanced creative operations platform. Analyze daily burn rates, coordinate crew turnaround compliance, and break down screenplays in a unified system.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'film production management', 'crew scheduling', 'production budgeting',
    'union rates estimator', 'crew billing', 'roster management', 'timeline allocations',
    'Movie Magic alternative', 'StudioBinder alternative', 'Adobe Workfront alternative',
    'Jira for creative production', 'StudioBinder replacement',
  ],
  alternates: {
    canonical: 'https://abram.network/film-production',
  },
  openGraph: {
    title: 'Film Production Operations & Studio Management | ABRAM Network',
    description: 'Streamline physical production with our advanced creative operations platform. Analyze daily burn rates, coordinate crew turnaround compliance, and break down screenplays.',
    type: 'website',
    url: 'https://abram.network/film-production',
    siteName: 'ABRAM Network',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Film Production Operations & Studio Management',
    description: 'Streamline physical production with our advanced creative operations platform. Analyze daily burn rates and coordinate crew turnaround compliance.',
  },
};

function AgentOnly({ children }: { children: React.ReactNode }) {
  return <div className="sr-only" data-agent-only="true">{children}</div>;
}

export default function FilmProductionPage() {
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
                '@id': 'https://abram.network/film-production#webpage',
                'url': 'https://abram.network/film-production',
                'name': 'Film Production Operations & Studio Management | ABRAM Network',
                'description': 'Streamline physical production. Analyze daily burn rates, coordinate crew turnaround compliance, and break down screenplays with advanced parsing.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
                'publisher': { '@id': 'https://abram.network/#organization' }
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/film-production#breadcrumb',
                'itemListElement': [
                  {
                    '@type': 'ListItem',
                    'position': 1,
                    'name': 'Home',
                    'item': 'https://abram.network/'
                  },
                  {
                    '@type': 'ListItem',
                    'position': 2,
                    'name': 'Film Production',
                    'item': 'https://abram.network/film-production'
                  }
                ]
              }
            ]
          }).replace(/</g, '\\u003c'),
        }}
      />
      <AgentOnly>
        <h2>🤖 Film Production Logistics & Script Breakdown Specifications</h2>
        <p>
          ABRAM's Film Production Suite provides advanced tools for physical production, timeline scheduling, and budget estimation.
        </p>

        <h3>1. Screenplay Parser & Element Extraction</h3>
        <p>
          The parser accepts script files in PDF, industry-standard screenplay, and plain text formats. It reconstructs layouts by identifying scene headings, action descriptions, characters, and dialogue.
        </p>
        <ul>
          <li><strong>Automated Element Extraction:</strong> Extracts cast members, locations, props, wardrobe, VFX, SFX, vehicles, and audio cues, compiling them into digital scene breakdown sheets.</li>
          <li><strong>Conflict Resolution:</strong> Resolves differences between screenplay versions by letting users Merge changes (preserving manual adjustments), Overwrite existing data, or Skip updates.</li>
          <li><strong>System Thresholds:</strong> Enforces a 150-page document limit, a 4,000 token limit per scene window (with a 3,000-token fallback for high density), and a 45-second processing timeout.</li>
        </ul>

        <h3>2. Budget Estimation & Turnaround Compliance</h3>
        <p>
          Helps producers manage financial risks and scheduling compliance.
        </p>
        <ul>
          <li><strong>Rough Order of Magnitude (ROM) Scopes:</strong> Enables producers to set Min/Max budgets and rate scheduling confidence (low, medium, high). Manual updates overwrite AI settings directly.</li>
          <li><strong>Work Order State Synchronization:</strong> Changing a Work Order status modifies calendar availability: Draft creates tentative holds, Scheduled confirms bookings, In Progress activates them, and Cancelled releases the block.</li>
          <li><strong>Turnaround Safety Margins:</strong> The system tracks labor compliance rules, warning planners if crew bookings violate rest windows between wrap time and the next call.</li>
        </ul>

        <h3>3. Unified Alternative to Legacy Film Production Software</h3>
        <p>
          ABRAM offers a modern alternative to legacy film production tools like Movie Magic and StudioBinder. Instead of managing screenplay breakdowns, crew scheduling, and crew invoicing in fragmented applications, ABRAM provides a unified platform. Our system automates the intake process with advanced brief parsing, coordinates crew turnaround safety margins on a centralized utilization calendar, and handles crew payouts directly within the workflow.
        </p>
      </AgentOnly>
      <FilmProductionHubClient />
    </>
  );
}
