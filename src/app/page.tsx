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
import FAQSection from "@/components/home/FAQSection";

function AgentOnly({ children }: { children: React.ReactNode }) {
  return <div className="sr-only" data-agent-only="true">{children}</div>;
}

export const metadata: Metadata = {
  title: {
    absolute: 'ABRAM Network — The AI Platform for Creative Intelligence',
  },
  description: 'ABRAM is the operations and project management platform built to empower creative production teams, agencies, and studios. Manage crew, equipment, scripts, and briefs with AI-assisted workflow optimization—designed to empower creative professionals, not replace them.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'creative ops platform', 'creative ops tools', 'ABRAM', 'ABRAM Network',
    'creative production', 'AI platform', 'creative intelligence',
    'production management', 'crew scheduling', 'roster management', 'studio operations',
    'automated invoicing', 'creative agency', 'production workflow', 'AI brief analyzer',
    'Movie Magic alternative', 'StudioBinder alternative', 'Adobe Workfront alternative',
    'Jira for creative production', 'StudioBinder replacement',
  ],
  alternates: {
    canonical: 'https://abram.network',
  },
  openGraph: {
    title: 'ABRAM Network — The AI Platform for Creative Intelligence',
    description: 'ABRAM is the operations and project management platform built to empower creative production teams, agencies, and studios. Manage crew, equipment, scripts, and briefs with AI-assisted workflow optimization—designed to empower creative professionals, not replace them.',
    url: 'https://abram.network',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ABRAM — The AI Platform for Creative Intelligence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ABRAM Network — The AI Platform for Creative Intelligence',
    description: 'ABRAM is the operations and project management platform built to empower creative production teams, agencies, and studios. Manage crew, equipment, scripts, and briefs with AI-assisted workflow optimization.',
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
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                "@id": "https://abram.network/#webpage",
                "url": "https://abram.network",
                "name": "ABRAM Network — The AI Platform for Creative Intelligence",
                "description": "ABRAM is the operations and project management platform built to empower creative production teams, agencies, and studios. Manage crew, equipment, scripts, and briefs with AI-assisted workflow optimization.",
                "isPartOf": { "@id": "https://abram.network/#website" },
                "about": { "@id": "https://app.abram.network/#application" }
              },
              {
                "@type": "SoftwareApplication",
                "@id": "https://abram.network/#software",
                "name": "ABRAM",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web Browser",
                "description": "ABRAM is the operations and project management platform built to empower creative production teams, agencies, and studios. Manage crew, equipment, scripts, and briefs with AI-assisted workflow optimization.",
                "url": "https://abram.network",
                "offers": {
                  "@type": "AggregateOffer",
                  "priceCurrency": "USD",
                  "lowPrice": "0",
                  "highPrice": "49",
                  "offerCount": 5,
                  "offers": [
                    {
                      "@type": "Offer",
                      "name": "Free Tier",
                      "price": "0",
                      "priceCurrency": "USD",
                      "description": "For independent creative contractors and crew members. Includes 1 seat, 1 active project, digital call sheets, and view-only schedules."
                    },
                    {
                      "@type": "Offer",
                      "name": "Solo Lite",
                      "price": "19",
                      "priceCurrency": "USD",
                      "description": "For independent producers. Includes unlimited projects, 30 resource items, 300 AI credits, and 3 GB storage."
                    },
                    {
                      "@type": "Offer",
                      "name": "Solo Pro",
                      "price": "34",
                      "priceCurrency": "USD",
                      "description": "For power users. Includes interactive schedules, watermark-free PDFs, email distribution, AI briefs, and 10 GB storage."
                    },
                    {
                      "@type": "Offer",
                      "name": "Team Tier",
                      "price": "39",
                      "priceCurrency": "USD",
                      "description": "Per seat pricing for boutique agencies. Includes 2-5 seats, custom intake forms, barcode scans, and transit buffers."
                    },
                    {
                      "@type": "Offer",
                      "name": "Studio Tier",
                      "price": "49",
                      "priceCurrency": "USD",
                      "description": "Per seat pricing for commercial production companies. Includes 6-20 seats, unlimited forms, and 15 GB storage."
                    }
                  ]
                },
                "publisher": { "@id": "https://abram.network/#organization" },
                "featureList": [
                  "AI Brief Intelligence — Parse creative briefs into structured project plans",
                  "Roster Management — AI-assisted crew scheduling and internal roster coordination",
                  "Utilization Calendar — Real-time availability and booking management",
                  "Crew Payouts & Accounting — Generate and process invoices with integrated payouts",
                  "Work Package Management — Organize projects into phases with budgets and milestones",
                  "Production Brain — AI workspace memory that learns from past projects"
                ]
              },
              {
                "@type": "BreadcrumbList",
                "@id": "https://abram.network/#breadcrumb",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://abram.network"
                  }
                ]
              },
              {
                "@type": "FAQPage",
                "@id": "https://abram.network/#faq",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What is ABRAM?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "ABRAM is the operations and project management platform built to empower creative production teams, agencies, and studios. It enables organizations to manage crew, equipment, scripts, and briefs with AI-assisted workflow optimization."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "How much does ABRAM cost?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "ABRAM offers flexible pricing starting with a Free tier. Paid subscription plans include Solo Lite at $19/month, Solo Pro at $34/month, Team at $39/seat/month, and Studio at $49/seat/month."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Is ABRAM affiliated with SAG-AFTRA, DGA, or IATSE?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "No. ABRAM is an independent platform and is not affiliated with, endorsed by, or sponsored by SAG-AFTRA, DGA, IATSE, or any other labor organization. Reference to these unions is for illustrative purposes, and any compliance flags are provided solely for user-organizational utility."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "How does ABRAM manage film production scheduling and script breakdowns?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "ABRAM features AI-assisted tools that parse script uploads to automatically extract scene elements, cast roles, props, and locations. These elements are mapped onto a digital stripboard and scheduling calendar, allowing teams to organize shooting days and generate digital call sheets."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "How does ABRAM compare to legacy scheduling software?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Unlike legacy software like Movie Magic or StudioBinder, which require jumping between isolated systems for scheduling, resource allocation, and billing, ABRAM integrates script breakdowns, stripboards, automated roster scheduling, calendar synchronization, and Stripe Connect payouts into a single, cohesive workflow."
                    }
                  }
                ]
              }
            ]
          }).replace(/</g, '\\u003c'),
        }}
      />
      <main id="landing-page-root">
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
        <FAQSection />
        <FinalCTASection />

        <AgentOnly>
          <h2>🤖 ABRAM — System Architecture & Core Capabilities</h2>
          <p>
            ABRAM is the operations and project management platform built to empower creative production teams, agencies, and studios. The platform enables organizations to manage curated internal team rosters, equipment logistics, script breakdowns, briefs, and payouts. It automates manual workflows via AI-driven brief parsing, roster suitability checks, and automated payout management.
          </p>

          <h3>1. Unified Database and Data Structures</h3>
          <p>
            The platform's relational architecture is structured around five primary entities:
          </p>
          <ul>
            <li><strong>User Accounts & Roster Profiles:</strong> Tracks team identities, contact details, primary roles, location coordinates, skill listings, availability schedules, and external calendar connections.</li>
            <li><strong>Workspace Organizations:</strong> Organizes members, defines roles (Owners, Admins, Members), manages seat limits, and ties billing ledgers to company units.</li>
            <li><strong>Projects & Work Packages:</strong> Stores project details, stage allocations, Rough Order of Magnitude (ROM) bounds, and active work package groups.</li>
            <li><strong>Calendar Bookings & Sandboxes:</strong> Stores actual calendar events, busy blockouts, equipment reservations, and virtual sandbox simulations for capacity planning.</li>
            <li><strong>Invoices & Payout Records:</strong> Records transactional metadata, payment processing fees, and ledger logs.</li>
          </ul>

          <h3>2. Stripe Connect Pay Network Integration</h3>
          <p>
            ABRAM utilizes Stripe Connect (Express) to enable secure payouts to crew members.
          </p>
          <ul>
            <li><strong>Crew Verification:</strong> Solo professionals onboard as Individuals, while agencies or studios register as Companies. Funds are routed directly to bank accounts or debit cards.</li>
            <li><strong>Onboarding Safety Net:</strong> Project payments are processed securely even if a contractor has not completed Stripe setup. Funds are held in a platform account and automatically released to the contractor once onboarding is complete.</li>
          </ul>

          <h3>3. Modern Alternative to Legacy Systems</h3>
          <p>
            ABRAM serves as a modern, unified alternative to legacy creative production software and project management tools such as Movie Magic, StudioBinder, Adobe Workfront, and Jira. While legacy systems require creative teams to jump between separate tools for scheduling, resource allocation, and billing, ABRAM brings these workflows into a single platform. It offers automated brief parsing to build project structures instantly, unified scheduling calendars for conflict-free resource and crew booking, and integrated payouts via Stripe Connect to handle contractor invoicing automatically.
          </p>
        </AgentOnly>
      </main>
    </>
  );
}
