import type { Metadata } from 'next';
import HeroSection from '@/components/production-brain/HeroSection';
import CopilotSandbox from '@/components/production-brain/CopilotSandbox';
import MemorySpheres from '@/components/production-brain/MemorySpheres';
import PassiveLearning from '@/components/production-brain/PassiveLearning';
import MatchmakingEngine from '@/components/production-brain/MatchmakingEngine';
import UnderTheHood from '@/components/production-brain/UnderTheHood';
import CollaborationIntegrations from '@/components/production-brain/CollaborationIntegrations';

export const metadata: Metadata = {
  title: 'Production Brain — Enterprise Workspace Memory | ABRAM Network',
  description: 'Discover ABRAM\'s Production Brain. A private, secure workspace intelligence engine built for our creative operations platform and creative production software.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'Production Brain', 'ABRAM Workspace Memory', 'AI production memory',
    'crew matching scores', 'workspace search', 'data security',
    'creative agency AI co-pilot', 'brief analyzer scoping',
  ],
  alternates: {
    canonical: 'https://abram.network/intelligence/brain',
  },
  openGraph: {
    title: 'Production Brain — Enterprise Workspace Memory | ABRAM Network',
    description: 'Discover ABRAM\'s Production Brain. A private, secure workspace intelligence engine built for our creative operations platform and creative production software.',
    type: 'website',
    url: 'https://abram.network/intelligence/brain',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Production Brain — Enterprise Workspace Memory | ABRAM Network',
    description: 'Discover ABRAM\'s Production Brain. A private, secure workspace intelligence engine built for our creative operations platform and creative production software.',
  },
};

export default function ProductionBrainPage() {
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
                '@id': 'https://abram.network/intelligence/brain#webpage',
                'name': 'ABRAM Production Brain',
                'description': 'Workspace memory and AI capabilities in the ABRAM creative production platform.',
                'url': 'https://abram.network/intelligence/brain',
                'isPartOf': { '@id': 'https://abram.network/#website' },
                'publisher': { '@id': 'https://abram.network/#organization' },
                'mainEntity': {
                  '@type': 'SoftwareApplication',
                  'name': 'ABRAM',
                  'applicationCategory': 'BusinessApplication',
                  'featureList': [
                    'Unified Workspace Memory',
                    'Secured Row-Level Security Isolated Scopes',
                    'Interactive Action Plan Approvals',
                    'Suitability Index Calculation Sliders',
                    'Continuous Passive Data Learning',
                  ],
                },
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/intelligence/brain#breadcrumb',
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
                  },
                  {
                    '@type': 'ListItem',
                    'position': 3,
                    'name': 'Production Brain',
                    'item': 'https://abram.network/intelligence/brain'
                  }
                ]
              }
            ]
          }).replace(/</g, '\\u003c'),
        }}
      />
      <main className="text-zinc-100 overflow-x-hidden pt-16 select-none relative z-10 isolate">

        {/* Section 1: Hero */}
        <div className="relative">
          {/* Indigo-950/20 glow behind Hero */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[60px] pointer-events-none z-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(30, 27, 75, 0.25) 0%, rgba(30, 27, 75, 0.2025) 10%, rgba(30, 27, 75, 0.16) 20%, rgba(30, 27, 75, 0.1225) 30%, rgba(30, 27, 75, 0.09) 40%, rgba(30, 27, 75, 0.0625) 50%, rgba(30, 27, 75, 0.04) 60%, rgba(30, 27, 75, 0.0225) 70%, rgba(30, 27, 75, 0.01) 80%, rgba(30, 27, 75, 0.0025) 90%, rgba(30, 27, 75, 0) 100%)' }}
          />
          <div className="relative z-10">
            <HeroSection />
          </div>
        </div>

        {/* Neural connection line split */}
        <div className="max-w-7xl mx-auto px-6 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent relative z-10" />

        {/* Section 2: Interactive Sandbox */}
        <div className="relative py-24 md:py-36">
          {/* Blue-950/15 glow behind Sandbox */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[60px] pointer-events-none z-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(23, 37, 84, 0.2) 0%, rgba(23, 37, 84, 0.162) 10%, rgba(23, 37, 84, 0.128) 20%, rgba(23, 37, 84, 0.098) 30%, rgba(23, 37, 84, 0.072) 40%, rgba(23, 37, 84, 0.05) 50%, rgba(23, 37, 84, 0.032) 60%, rgba(23, 37, 84, 0.018) 70%, rgba(23, 37, 84, 0.008) 80%, rgba(23, 37, 84, 0.002) 90%, rgba(23, 37, 84, 0) 100%)' }}
          />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-3">CO-PILOT INTERFACE</span>
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 font-sans mb-4">Conversational Scoping Sandbox</h2>
              <p className="text-zinc-400 leading-relaxed text-base font-sans">
                Review action plans, parse documents, and toggle intelligence models. Interact with the sandbox below to experience how the Co-pilot coordinates with the central memory.
              </p>
            </div>
            <CopilotSandbox />
          </div>
        </div>

        {/* Section 3: Dual Memory Spheres */}
        <div className="relative py-24 md:py-36">
          {/* Indigo-950/15 glow behind Memory Spheres */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[60px] pointer-events-none z-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(30, 27, 75, 0.2) 0%, rgba(30, 27, 75, 0.162) 10%, rgba(30, 27, 75, 0.128) 20%, rgba(30, 27, 75, 0.098) 30%, rgba(30, 27, 75, 0.072) 40%, rgba(30, 27, 75, 0.05) 50%, rgba(30, 27, 75, 0.032) 60%, rgba(30, 27, 75, 0.018) 70%, rgba(30, 27, 75, 0.008) 80%, rgba(30, 27, 75, 0.002) 90%, rgba(30, 27, 75, 0) 100%)' }}
          />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-3">MEMORY ARCHITECTURE</span>
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 font-sans mb-4">Dual-Scope Memory Architecture</h2>
              <p className="text-zinc-400 leading-relaxed text-base font-sans">
                The system separates your workspace memory into two isolated scopes, ensuring complete confidentiality for individual creators and total organizational alignment for companies.
              </p>
            </div>
            <MemorySpheres />
          </div>
        </div>

        {/* Section 4: Passive Learning */}
        <div className="relative py-24 md:py-36">
          {/* Violet-950/10 glow behind Passive Learning */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[60px] pointer-events-none z-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(46, 16, 101, 0.14) 0%, rgba(46, 16, 101, 0.1134) 10%, rgba(46, 16, 101, 0.0896) 20%, rgba(46, 16, 101, 0.0686) 30%, rgba(46, 16, 101, 0.0504) 40%, rgba(46, 16, 101, 0.035) 50%, rgba(46, 16, 101, 0.0224) 60%, rgba(46, 16, 101, 0.0126) 70%, rgba(46, 16, 101, 0.0056) 80%, rgba(46, 16, 101, 0.0014) 90%, rgba(46, 16, 101, 0) 100%)' }}
          />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-3">ZERO INPUT</span>
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 font-sans mb-4">Continuous Background Indexing</h2>
              <p className="text-zinc-400 leading-relaxed text-base font-sans">
                The Production Brain builds itself passively in the background as your team submits timesheets, intakes briefs, and books resources. No training files required.
              </p>
            </div>
            <PassiveLearning />
          </div>
        </div>

        {/* Section 5: Matchmaking Engine */}
        <div className="relative py-24 md:py-36">
          {/* Red-950/10 glow behind Matchmaking engine */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full blur-[60px] pointer-events-none z-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(69, 10, 10, 0.14) 0%, rgba(69, 10, 10, 0.1134) 10%, rgba(69, 10, 10, 0.0896) 20%, rgba(69, 10, 10, 0.0686) 30%, rgba(69, 10, 10, 0.0504) 40%, rgba(69, 10, 10, 0.035) 50%, rgba(69, 10, 10, 0.0224) 60%, rgba(69, 10, 10, 0.0126) 70%, rgba(69, 10, 10, 0.0056) 80%, rgba(69, 10, 10, 0.0014) 90%, rgba(69, 10, 10, 0) 100%)' }}
          />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-3">MATCHMAKING SCORING</span>
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 font-sans mb-4">Weighted Suitability Scores</h2>
              <p className="text-zinc-400 leading-relaxed text-base font-sans">
                Find the perfect fit for your roles. Adjust the sliders below to see how suitability scores shift in real-time based on your priority weights.
              </p>
            </div>
            <MatchmakingEngine />
          </div>
        </div>

        {/* Section 6: Collaboration Integrations */}
        <CollaborationIntegrations />

        {/* Section 7: Under the Hood */}
        <div className="relative py-24 md:py-36">
          {/* Slate-900/15 glow behind Under the Hood */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[60px] pointer-events-none z-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.162) 10%, rgba(15, 23, 42, 0.128) 20%, rgba(15, 23, 42, 0.098) 30%, rgba(15, 23, 42, 0.072) 40%, rgba(15, 23, 42, 0.05) 50%, rgba(15, 23, 42, 0.032) 60%, rgba(15, 23, 42, 0.018) 70%, rgba(15, 23, 42, 0.008) 80%, rgba(15, 23, 42, 0.002) 90%, rgba(15, 23, 42, 0) 100%)' }}
          />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-3">SYSTEM ARCHITECTURE</span>
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 font-sans mb-4">Under the Hood</h2>
              <p className="text-zinc-400 leading-relaxed text-base font-sans">
                Deeper technical insights into the dense vector similarity search, secure indexing relays, and prompt token cache structures.
              </p>
            </div>
            <UnderTheHood />
          </div>
        </div>

      </main>
    </>
  );
}
