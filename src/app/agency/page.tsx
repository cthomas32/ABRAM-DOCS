import type { Metadata } from 'next';
import AgencyHubClient from '@/app/agency/AgencyHubClient';

export const metadata: Metadata = {
  title: 'Creative Agency Operations & Project Management | ABRAM Network',
  description: 'Scale agency and studio workflows in a unified creative operations platform. Parse project briefs and coordinate crew rosters with advanced production management tools.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'creative operations', 'agency management software', 'studio logistics',
    'crew roster management', 'brief intelligence', 'scheduling tool', 'workspace intelligence',
    'Movie Magic alternative', 'StudioBinder alternative', 'Adobe Workfront alternative',
    'Jira for creative production', 'StudioBinder replacement',
  ],
  alternates: {
    canonical: 'https://abram.network/agency',
  },
  openGraph: {
    title: 'Creative Agency Operations & Project Management | ABRAM Network',
    description: 'Scale agency and studio workflows in a unified creative operations platform. Parse project briefs and coordinate crew rosters with advanced production management tools.',
    type: 'website',
    url: 'https://abram.network/agency',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creative Agency Operations & Project Management | ABRAM Network',
    description: 'Scale agency and studio workflows in a unified creative operations platform. Parse project briefs and coordinate crew rosters with advanced production management tools.',
  },
};

function AgentOnly({ children }: { children: React.ReactNode }) {
  return <div className="sr-only" data-agent-only="true">{children}</div>;
}

export default function AgencyHubPage() {
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
                '@id': 'https://abram.network/agency#webpage',
                'url': 'https://abram.network/agency',
                'name': 'Creative Agency Operations & Project Management | ABRAM Network',
                'description': 'Scale agency and studio workflows in a unified environment. Automate project brief requests, coordinate crew rosters, and streamline smart scheduling.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
                'publisher': { '@id': 'https://abram.network/#organization' }
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/agency#breadcrumb',
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
                    'name': 'Creative Agency',
                    'item': 'https://abram.network/agency'
                  }
                ]
              }
            ]
          }).replace(/</g, '\\u003c'),
        }}
      />
      <AgentOnly>
        <h2>🤖 Agency Operations, Integrations & Resource Sandboxes</h2>
        <p>
          The Creative Operations Hub supports agency scale through client intake wizards, smart scheduling, and multi-app connectors.
        </p>

        <h3>1. Slack Notification Connector</h3>
        <p>
          Keeps team members aligned via real-time notifications routed globally or configured per-project.
        </p>
        <ul>
          <li><strong>Notification Categories:</strong> Sends alerts for milestones, task assignments, reviews, financial invoicing approvals, and call sheet distributions.</li>
          <li><strong>Interactive Slack Actions:</strong> Interactive buttons allow users to Approve or Request Revisions on deliverables, or Mark On-Site for call sheets directly in Slack. Notifications update in-place to prevent duplication.</li>
          <li><strong>Manual Fallback:</strong> If channel lists are unavailable, administrators can manually configure Slack Channel IDs and Channel Names (requiring the bot to be invited to private channels).</li>
        </ul>

        <h3>2. Frame.io Workspace & Asset Review</h3>
        <p>
          Provides direct video review capabilities using the Frame.io V4 REST API.
        </p>
        <ul>
          <li><strong>Automated Workspace Provisioning:</strong> Connects to Frame.io to create project folders matching the ABRAM project name. Read-only members can browse assets, while Admins manage setup.</li>
          <li><strong>Link Recovery & Re-Provisioning:</strong> If links break, admins can Clear Link Reference (preserving Frame.io files) or Re-Provision Project (creating a fresh folder and syncing references).</li>
          <li><strong>Review Share Tracking:</strong> Tracks active presentation links and video files, pulling comments and version stacks into the main dashboard.</li>
        </ul>

        <h3>3. What-If Capacity Sandboxes</h3>
        <p>
          Producers simulate scheduling changes using virtual sandboxes. Simulated bookings do not affect real calendar availability. Once approved, the sandbox is Applied, and capacity holds convert into active project bookings.
        </p>

        <h3>4. Legacy Project Management Replacement</h3>
        <p>
          ABRAM Network acts as a powerful alternative to general project management software like Jira and Adobe Workfront for creative agencies. Rather than forcing creative operations into complex development tickets, ABRAM streamlines agency scheduling, crew roster scheduling, and client brief parsing. It coordinates agency rosters with built-in sandbox simulations and resolves invoicing delays through integrated crew payout features.
        </p>
      </AgentOnly>
      <AgencyHubClient />
    </>
  );
}
