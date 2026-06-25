import type { Metadata } from 'next';
import HeroSection from "@/components/film-production/HeroSection";
import FeatureCatalogList from "@/components/film-production/FeatureCatalogList";
import InteractivePlayground from "@/components/film-production/InteractivePlayground";

export const metadata: Metadata = {
  title: 'Film Production Scheduling & Budgeting',
  description: 'Coordinate crew rosters, manage budgets, and resolve scheduling conflicts in a unified interactive timeline with advanced creative operations tools.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'film production management', 'crew scheduling', 'production budgeting',
    'union rates estimator', 'crew payouts', 'timeline allocations',
  ],
  alternates: {
    canonical: 'https://abram.network/film-production/scheduling-budgeting',
  },
  openGraph: {
    title: 'Film Production Scheduling & Budgeting | ABRAM Network',
    description: 'Coordinate crew rosters, manage budgets, and resolve scheduling conflicts in a unified interactive timeline with advanced creative operations tools.',
    type: 'website',
    url: 'https://abram.network/film-production/scheduling-budgeting',
  },
};

export default function SchedulingBudgetingPage() {
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
                '@id': 'https://abram.network/film-production/scheduling-budgeting#webpage',
                'url': 'https://abram.network/film-production/scheduling-budgeting',
                'name': 'Film Production Scheduling & Budgeting | ABRAM Network',
                'description': 'Coordinate crew rosters, manage budgets, and resolve scheduling conflicts in a unified interactive timeline with advanced creative operations tools.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
                'publisher': { '@id': 'https://abram.network/#organization' }
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/film-production/scheduling-budgeting#breadcrumb',
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
                  },
                  {
                    '@type': 'ListItem',
                    'position': 3,
                    'name': 'Scheduling & Budgeting',
                    'item': 'https://abram.network/film-production/scheduling-budgeting'
                  }
                ]
              }
            ]
          }).replace(/</g, '\\u003c'),
        }}
      />
      <main className="text-zinc-100 overflow-x-hidden pt-16 select-none relative z-10 isolate">
        {/* 1. Hero Section */}
        <HeroSection />
        
        {/* Divider */}
        <div className="max-w-7xl mx-auto px-6 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent relative z-10" />

        {/* 2. Interactive Playground (The Core Sandbox Demo) */}
        <section id="interactive-playground" className="relative w-full py-20 md:py-28 bg-transparent overflow-visible border-t border-white/[0.08]">
          {/* Ambient Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] md:w-[600px] h-[350px] bg-[#8ECAFF]/[0.025] rounded-full filter blur-[100px] pointer-events-none -z-10" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
            <div className="text-center space-y-4 max-w-xl mx-auto">
              <span className="font-display text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 block">
                Interactive Playground
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-50 font-sans">
                Experience the Controls
              </h2>
              <p className="text-sm font-normal text-zinc-400 leading-relaxed font-sans">
                Test the stripboard schedule, check the Day Out of Days actor holds, and adjust variables to watch the budget ledger update in real-time.
              </p>
            </div>

            <div className="w-full">
              <InteractivePlayground />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-7xl mx-auto px-6 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent relative z-10" />

        {/* 3. Feature Catalog List */}
        <FeatureCatalogList />
      </main>
    </>
  );
}
