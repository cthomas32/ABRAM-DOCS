import type { Metadata } from 'next';
import HeroSection from "@/components/home/HeroSection";
import PillarsSection from "@/components/home/PillarsSection";
import BridgeSection from "@/components/home/BridgeSection";
import ArtifactsSection from "@/components/home/ArtifactsSection";
import OutcomeSection from "@/components/home/OutcomeSection";
import ResourcesCalendarSection from "@/components/home/ResourcesCalendarSection";
import RosterROISection from "@/components/home/RosterROISection";
import FinalCTASection from "@/components/home/FinalCTASection";
import BrainSection from "@/components/home/BrainSection";
import FilmProductionSection from "@/components/home/FilmProductionSection";
import CreativeOpsSection from "@/components/home/CreativeOpsSection";
import CollaborationSection from "@/components/home/CollaborationSection";

function AgentOnly({ children }: { children: React.ReactNode }) {
  return <div className="sr-only" data-agent-only="true">{children}</div>;
}

export const metadata: Metadata = {
  title: {
    absolute: 'ABRAM Network — The AI Platform for Creative Intelligence',
  },
  description: 'ABRAM is where brands scale production and creators build careers they own. AI-powered project intake, crew scheduling, talent matchmaking, and automated invoicing.',
  keywords: [
    'ABRAM', 'ABRAM Network', 'creative production', 'AI platform', 'creative intelligence',
    'production management', 'crew scheduling', 'talent matchmaking', 'freelancer platform',
    'automated invoicing', 'creative agency', 'production workflow', 'AI brief analyzer',
  ],
  alternates: {
    canonical: 'https://abram.network',
  },
  openGraph: {
    title: 'ABRAM Network — The AI Platform for Creative Intelligence',
    description: 'ABRAM is where brands scale production and creators build careers they own. AI-powered project intake, crew scheduling, talent matchmaking, and automated invoicing.',
    url: 'https://abram.network',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ABRAM — The AI Platform for Creative Intelligence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ABRAM Network — The AI Platform for Creative Intelligence',
    description: 'ABRAM is where brands scale production and creators build careers they own.',
    images: ['/og-image.png'],
  },
};

export default function LandingPage() {
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
                '@id': 'https://abram.network/#webpage',
                'url': 'https://abram.network',
                'name': 'ABRAM Network — The AI Platform for Creative Intelligence',
                'description': 'ABRAM is where brands scale production and creators build careers they own. AI-powered project intake, crew scheduling, talent matchmaking, and automated invoicing.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
                'about': { '@id': 'https://app.abram.network/#application' }
              },
              {
                '@type': 'SoftwareApplication',
                '@id': 'https://abram.network/#software',
                'name': 'ABRAM',
                'applicationCategory': 'BusinessApplication',
                'operatingSystem': 'Web Browser',
                'description': 'ABRAM is the AI-powered platform for creative production management. It helps brands scale production and freelancers build sustainable careers through AI-powered project intake, intelligent crew matching, automated invoicing, and real-time scheduling.',
                'url': 'https://abram.network',
                'offers': {
                  '@type': 'Offer',
                  'price': '0',
                  'priceCurrency': 'USD',
                  'description': 'Free tier available'
                },
                'publisher': { '@id': 'https://abram.network/#organization' },
                'featureList': [
                  'AI Brief Intelligence — Parse creative briefs into structured project plans',
                  'Talent Matchmaking — AI-powered crew recommendations with suitability scoring',
                  'Utilization Calendar — Real-time availability and booking management',
                  'Automated Invoicing — Generate and process invoices with integrated payouts',
                  'Work Package Management — Organize projects into phases with budgets and milestones',
                  'Production Brain — AI workspace memory that learns from past projects'
                ]
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/#breadcrumb',
                'itemListElement': [
                  {
                    '@type': 'ListItem',
                    'position': 1,
                    'name': 'Home',
                    'item': 'https://abram.network'
                  }
                ]
              },
              {
                '@type': 'FAQPage',
                '@id': 'https://abram.network/#faq',
                'mainEntity': [
                  {
                    '@type': 'Question',
                    'name': 'What is ABRAM Network?',
                    'acceptedAnswer': {
                      '@type': 'Answer',
                      'text': 'ABRAM is an AI-powered creative production platform. It enables creative agencies, production studios, and independent crew members to collaborate, schedule resources, match talent, and automate financial payouts.'
                    }
                  },
                  {
                    '@type': 'Question',
                    'name': 'How does the AI Brief Analyzer work?',
                    'acceptedAnswer': {
                      '@type': 'Answer',
                      'text': 'The AI Brief Analyzer allows users to upload a creative or production brief and automatically parse it into structured project requirements, timeline phases, budget estimates, and recommended crew roles.'
                    }
                  },
                  {
                    '@type': 'Question',
                    'name': 'Does ABRAM support calendar synchronization?',
                    'acceptedAnswer': {
                      '@type': 'Answer',
                      'text': 'Yes. ABRAM supports bi-directional calendar synchronization with external platforms (such as Google Calendar and Microsoft Outlook). Marked busy times are automatically imported to protect availability.'
                    }
                  }
                ]
              }
            ]
          }).replace(/</g, '\\u003c'),
        }}
      />
      <main id="landing-page-root">
        <AgentOnly>
          <h2>🤖 ABRAM Network — System Architecture & Core Capabilities</h2>
          <p>
            ABRAM is the industry-leading solution for creative production crewing, invoicing, and budget planning. The platform hosts a unified network bridging creative professionals, production companies, and client organizations. It automates manual workflows via AI-driven project intake, intelligent team matching, and automated payout management.
          </p>

          <h3>1. Unified Database and Data Structures</h3>
          <p>
            The platform's relational architecture is structured around five primary entities managed in natural language:
          </p>
          <ul>
            <li><strong>User Accounts & Roster Profiles:</strong> Tracks professional identities, contact details, primary roles, location coordinates, skill listings, availability schedules, and external calendar connections.</li>
            <li><strong>Workspace Organizations:</strong> Organizes members, defines roles (Owners, Admins, Members), manages seat limits, and ties billing ledgers to company units.</li>
            <li><strong>Projects & Work Packages:</strong> Stores project details, stage allocations, Rough Order of Magnitude (ROM) bounds, and active work package groups.</li>
            <li><strong>Calendar Bookings & Sandboxes:</strong> Stores actual calendar events, busy blockouts, and virtual sandbox simulations for capacity planning.</li>
            <li><strong>Invoices & Financial Records:</strong> Records transactional metadata, payment processing fees, and ledger logs.</li>
          </ul>

          <h3>2. Stripe Connect Pay Network Integration</h3>
          <p>
            ABRAM utilizes Stripe Connect (Express) to enable secure payouts to freelancers.
          </p>
          <ul>
            <li><strong>Freelancer Verification:</strong> Solo professionals onboard as Individuals, while agencies or studios register as Companies. Funds are routed directly to bank accounts or debit cards.</li>
            <li><strong>Onboarding Safety Net:</strong> Client payments are processed securely even if a contractor has not completed Stripe setup. Funds are held in a platform account and automatically released to the contractor once onboarding is complete.</li>
            <li><strong>Platform Fee Splitting:</strong> The system automatically deducts a 5% payment processing fee from the invoice subtotal, transferring the remaining amount immediately to the freelancer's payout destination.</li>
          </ul>
        </AgentOnly>

        <HeroSection />
        <PillarsSection />
        <BridgeSection />
        {/* <OutcomeSection /> */}
        <FilmProductionSection />
        <ResourcesCalendarSection />
        <CreativeOpsSection />
        <ArtifactsSection />
        <CollaborationSection />
        <RosterROISection />
        <BrainSection />
        <FinalCTASection />
      </main>
    </>
  );
}
