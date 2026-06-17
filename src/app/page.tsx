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


export const metadata: Metadata = {
  title: 'ABRAM Network — The AI Platform for Creative Intelligence',
  description: 'ABRAM is where brands scale production and creators build careers they own. AI-powered project intake, crew scheduling, talent matchmaking, and automated invoicing.',
  keywords: [
    'ABRAM', 'ABRAM Network', 'creative production', 'AI platform', 'creative intelligence',
    'production management', 'crew scheduling', 'talent matchmaking', 'freelancer platform',
    'automated invoicing', 'creative agency', 'production workflow', 'AI brief analyzer',
  ],
  alternates: {
    canonical: 'https://docs.abram.network',
  },
  openGraph: {
    title: 'ABRAM Network — The AI Platform for Creative Intelligence',
    description: 'ABRAM is where brands scale production and creators build careers they own. AI-powered project intake, crew scheduling, talent matchmaking, and automated invoicing.',
    url: 'https://docs.abram.network',
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
            '@type': 'SoftwareApplication',
            name: 'ABRAM',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web Browser',
            description: 'ABRAM is the AI-powered platform for creative production management. It helps brands scale production and freelancers build sustainable careers through AI-powered project intake, intelligent crew matching, automated invoicing, and real-time scheduling.',
            url: 'https://abram.network',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description: 'Free tier available',
            },
            publisher: {
              '@type': 'Organization',
              name: 'ABRAM Network',
              url: 'https://abram.network',
            },
            featureList: [
              'AI Brief Intelligence — Parse creative briefs into structured project plans',
              'Talent Matchmaking — AI-powered crew recommendations with suitability scoring',
              'Utilization Calendar — Real-time availability and booking management',
              'Automated Invoicing — Generate and process invoices with integrated payouts',
              'Work Package Management — Organize projects into phases with budgets and milestones',
              'Production Brain — AI workspace memory that learns from past projects',
            ],
          }).replace(/</g, '\\u003c'),
        }}
      />
      <main id="landing-page-root">
        <HeroSection />
        <PillarsSection />
        <BridgeSection />
        <ArtifactsSection />
        {/* <OutcomeSection /> */}
        <ResourcesCalendarSection />
        <RosterROISection />
        <BrainSection />
        <FinalCTASection />
      </main>
    </>
  );
}
