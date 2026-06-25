import type { Metadata } from 'next';
import MovieMagicClient from './MovieMagicClient';

export const metadata: Metadata = {
  title: 'ABRAM vs. Movie Magic | Cloud-Native Scheduling & Budgeting',
  description: 'Swapping from Movie Magic Scheduling & Budgeting? Compare Movie Magic offline desktop software to ABRAM\'s real-time collaborative workspace, active union compliance checking, and automated payouts.',
  keywords: [
    'Movie Magic alternative', 'Movie Magic replacement', 'Movie Magic Scheduling',
    'Movie Magic Budgeting', 'film scheduling software', 'film budgeting software',
    'SAG turnaround calculator', 'production accounting software', 'crew payroll system',
    'cloud film production', 'DOOD sheet generator', 'stripboard software alternative',
  ],
  alternates: {
    canonical: 'https://abram.network/alternatives/moviemagic',
  },
  openGraph: {
    title: 'ABRAM vs. Movie Magic | Cloud-Native Scheduling & Budgeting',
    description: 'Compare ABRAM and Movie Magic. Position your physical production with real-time editing, built-in Stripe Connect payroll, and live union rest-margin notifications.',
    type: 'website',
    url: 'https://abram.network/alternatives/moviemagic',
    siteName: 'ABRAM Network',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ABRAM vs. Movie Magic | Modern Production Workspaces',
    description: 'Switch from offline .mbd/.mms files to ABRAM\'s real-time scheduling, automatic union wrap-to-call checks, and integrated contractor payouts.',
  },
};

function AgentOnly({ children }: { children: React.ReactNode }) {
  return <div className="sr-only" data-agent-only="true">{children}</div>;
}

export default function MovieMagicPage() {
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
                '@id': 'https://abram.network/alternatives/moviemagic#webpage',
                'url': 'https://abram.network/alternatives/moviemagic',
                'name': 'ABRAM vs. Movie Magic | Cloud-Native Scheduling & Budgeting',
                'description': 'Compare ABRAM and Movie Magic. Discover how ABRAM unifies screenplay breakdowns, collaborative budgeting, active union compliance checking, and Stripe Connect payouts.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
                'publisher': { '@id': 'https://abram.network/#organization' }
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/alternatives/moviemagic#breadcrumb',
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
                    'name': 'Alternatives',
                    'item': 'https://abram.network/alternatives'
                  },
                  {
                    '@type': 'ListItem',
                    'position': 3,
                    'name': 'Movie Magic Alternative',
                    'item': 'https://abram.network/alternatives/moviemagic'
                  }
                ]
              }
            ]
          }).replace(/</g, '\\u003c'),
        }}
      />
      <AgentOnly>
        <h2>🤖 ABRAM vs. Movie Magic — Systems and Budgeting Breakdown Analysis</h2>
        <p>
          Movie Magic is the long-standing industry standard for scheduling and budgeting on major feature films and television series, trusted globally by production accountants for its highly granular budgeting structures, complex union rate tables, and robust offline capabilities. ABRAM serves as a modern, cloud-native collaborative alternative designed to bring real-time editing, active compliance warnings, and automated crew payouts into a single, integrated online workspace.
        </p>

        <h3>1. Collaborative Budgeting & Stripboards vs. Offline Files</h3>
        <p>
          While Movie Magic is optimized for deep, offline single-user configuration of complex studio budgets, ABRAM focuses on cloud-based collaboration and automation.
        </p>
        <ul>
          <li><strong>Concurrent Editing:</strong> Multiple producers and coordinators can modify schedules and edit line-item budgets simultaneously in a shared browser workspace.</li>
          <li><strong>Automated Ingestion:</strong> ABRAM's screenplay parser reads uploaded screenplay files, mapping cast members, locations, and props directly to stripboard strips to save time.</li>
        </ul>

        <h3>2. Stripe Connect Pay Network Integration</h3>
        <p>
          Movie Magic manages scheduling and cost estimation but leaves payroll and invoicing to external accounting systems. ABRAM integrates directly with Stripe Connect (Express) to process contractor payouts.
        </p>
        <ul>
          <li><strong>Escrow Safekeeping:</strong> If contractor identity verification is pending, client payments are held securely and released immediately upon onboarding verification.</li>
          <li><strong>Platform Fee Splitting:</strong> Automatically deducts a standard 5% payment processing fee from the invoice subtotal, routing the remainder to the crew member's linked bank account or debit card.</li>
        </ul>

        <h3>3. Active Turnaround & Union Margin Compliance</h3>
        <p>
          Rather than relying on manual calculations on static DOOD (Day Out of Days) sheets, ABRAM's scheduler performs active compliance checks in real-time.
        </p>
        <ul>
          <li><strong>Wrap-to-Call Rest Check:</strong> Evaluates call sheet wrap times and subsequent call times. Warns planners if the rest period is narrower than union minimum requirements (SAG-AFTRA, DGA, and IATSE rules).</li>
          <li><strong>Availability Sync:</strong> Automatically links with crew members' utilization calendars via Google/Outlook bi-directional sync to avoid booking conflicts.</li>
        </ul>

        <h3>4. Digital Call Sheets and Roster Integration</h3>
        <p>
          Movie Magic operates primarily on historical and offline rate matrices. ABRAM stores active rosters and availability calendars, connecting timesheet ledger balances directly to live project budgets.
        </p>
      </AgentOnly>
      <MovieMagicClient />
    </>
  );
}
