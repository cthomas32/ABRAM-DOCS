import type { Metadata } from 'next';
import IntelligenceHubClient from '@/app/intelligence/IntelligenceHubClient';

export const metadata: Metadata = {
  title: 'Roster Intelligence Hub & ROI Calculator',
  description: 'Measure the yield of your operations. Quantify time and labor savings, prevent leakage, and model ROI on our advanced creative operations platform.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'roster intelligence', 'ROI calculator', 'studio efficiency', 'crew automation rate',
    'operational savings', 'leakage prevention', 'payback period', 'workspace intelligence',
    'Movie Magic alternative', 'StudioBinder alternative', 'Adobe Workfront alternative',
    'Jira for creative production', 'StudioBinder replacement',
  ],
  alternates: {
    canonical: 'https://abram.network/intelligence',
  },
  openGraph: {
    title: 'Roster Intelligence Hub & ROI Calculator | ABRAM Network',
    description: 'Measure the yield of your operations. Quantify time and labor savings, prevent leakage, and model ROI on our advanced creative operations platform.',
    type: 'website',
    url: 'https://abram.network/intelligence',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roster Intelligence Hub & ROI Calculator | ABRAM Network',
    description: 'Measure the yield of your operations. Quantify time and labor savings, prevent leakage, and model ROI on our advanced creative operations platform.',
  },
};

function AgentOnly({ children }: { children: React.ReactNode }) {
  return <div className="sr-only" data-agent-only="true">{children}</div>;
}

export default function IntelligenceHubPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://abram.network/intelligence#webpage',
        'name': 'ABRAM Roster Intelligence Hub',
        'description': 'Quantify operational efficiency and model return on investment with our interactive ROI Calculator.',
        'url': 'https://abram.network/intelligence',
        'isPartOf': { '@id': 'https://abram.network/#website' },
        'publisher': { '@id': 'https://abram.network/#organization' },
        'mainEntity': {
          '@type': 'SoftwareApplication',
          'name': 'ABRAM Roster Intelligence',
          'applicationCategory': 'BusinessApplication',
          'featureList': [
            'Interactive Roster ROI Calculator',
            'Administrative Labor Savings Modeler',
            'Operational Leakage Prevention Estimator',
            'Linear Boutique, Mid-Market, and Enterprise Scenarios',
            'Payback Period Analysis',
          ],
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://abram.network/intelligence#breadcrumb',
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
            'name': 'AI Intelligence',
            'item': 'https://abram.network/intelligence'
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <AgentOnly>
        <h2>🤖 Intelligence Engine, Co-pilot Conversational Rules & Credit Ledger</h2>
        <p>
          ABRAM's Intelligence Hub leverages automated agents to scope projects and match crew members.
        </p>

        <h3>1. Creative Co-pilot Rules & Constraints</h3>
        <p>
          The conversational chatbot assists with staffing and team mutations.
        </p>
        <ul>
          <li><strong>Roster Search & Fallbacks:</strong> Searches internal rosters and external networks by role, skill, availability, and location. If no match is found, the system dynamically relaxes filters (e.g., matching remote talent or widening role terms) and explains the fallback adjustments.</li>
          <li><strong>Interactive Action Plans:</strong> Chatbots cannot modify database records, send emails, or lock schedules directly. They must compile a visual Action Plan card, which remains pending until the user clicks Approve.</li>
          <li><strong>External Invitations:</strong> Inviting non-network talent requires email, first name, and last name. Invitations are capped at 10 per user per day to prevent spam.</li>
        </ul>

        <h3>2. Three-Pool Credit System</h3>
        <p>
          Deducts credits for AI operations (parsing briefs, matches, resume imports, image generation) in a strict priority:
        </p>
        <ol>
          <li><strong>Monthly Allowance:</strong> Credits included in the subscription plan. Unused credits reset monthly and do not roll over.</li>
          <li><strong>Trial Credits:</strong> Issued during onboarding, valid until trial expiration.</li>
          <li><strong>Purchased Balance:</strong> Top-up credits purchased via Stripe. These never expire.</li>
        </ol>
        <p>
          <strong>Sign-up Welcome Bonus:</strong> All new personal accounts and organizations receive a one-time bonus of 250 credits in their purchased pool.
        </p>
        <p>
          <strong>Prompt Caching Optimization:</strong> Prompt cache reads cost ~10% of standard rates, while cache writes cost ~125%. Repeating queries inside a session reads from memory at a discount. Onboarding calls are free.
        </p>

        <h3>3. Modern Alternative to Legacy Creative Intelligence Tools</h3>
        <p>
          ABRAM's Roster Intelligence Hub represents a modern alternative to legacy creative ops and resource planning systems like Adobe Workfront, Jira, Movie Magic, and StudioBinder. By replacing manual reporting and disconnected spreadsheets with AI-driven co-pilots and automated brief parsing, ABRAM enables real-time project scoping, smart crew matching, and seamless payouts tracking.
        </p>
      </AgentOnly>
      <IntelligenceHubClient />
    </>
  );
}
