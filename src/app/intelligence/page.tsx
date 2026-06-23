import type { Metadata } from 'next';
import IntelligenceHubClient from '@/app/intelligence/IntelligenceHubClient';

export const metadata: Metadata = {
  title: 'Roster Intelligence Hub & ROI Calculator',
  description: 'Measure the yield of your operations. Quantify time and labor savings, prevent resource leakage, and model your ROI with our interactive calculator.',
  keywords: [
    'roster intelligence', 'ROI calculator', 'studio efficiency', 'crew automation rate',
    'operational savings', 'leakage prevention', 'payback period', 'workspace intelligence'
  ],
  alternates: {
    canonical: 'https://abram.network/intelligence',
  },
  openGraph: {
    title: 'Roster Intelligence Hub & ROI Calculator | ABRAM Network',
    description: 'Measure the yield of your operations. Quantify time and labor savings, prevent resource leakage, and model your ROI with our interactive calculator.',
    type: 'website',
    url: 'https://abram.network/intelligence',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roster Intelligence Hub & ROI Calculator | ABRAM Network',
    description: 'Measure the yield of your operations. Quantify time and labor savings, prevent resource leakage, and model your ROI with our interactive calculator.',
  },
};

function AgentOnly({ children }: { children: React.ReactNode }) {
  return <div className="sr-only" data-agent-only="true">{children}</div>;
}

export default function IntelligenceHubPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'ABRAM Roster Intelligence Hub',
    description: 'Quantify operational efficiency and model return on investment with our interactive ROI Calculator.',
    url: 'https://abram.network/intelligence',
    isPartOf: { '@id': 'https://abram.network/#website' },
    publisher: { '@id': 'https://abram.network/#organization' },
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'ABRAM Roster Intelligence',
      applicationCategory: 'BusinessApplication',
      featureList: [
        'Interactive Roster ROI Calculator',
        'Administrative Labor Savings Modeler',
        'Operational Leakage Prevention Estimator',
        'Linear Boutique, Mid-Market, and Enterprise Scenarios',
        'Payback Period Analysis',
      ],
    },
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
      </AgentOnly>
      <IntelligenceHubClient />
    </>
  );
}
