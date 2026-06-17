import type { Metadata } from 'next';
import HeroSection from '@/components/production-brain/HeroSection';
import CopilotSandbox from '@/components/production-brain/CopilotSandbox';
import MemorySpheres from '@/components/production-brain/MemorySpheres';
import PassiveLearning from '@/components/production-brain/PassiveLearning';
import MatchmakingEngine from '@/components/production-brain/MatchmakingEngine';
import UnderTheHood from '@/components/production-brain/UnderTheHood';

export const metadata: Metadata = {
  title: 'Production Brain — Enterprise Workspace Memory',
  description: 'Discover ABRAM\'s Production Brain. A private, secure workspace intelligence engine that learns crew preferences, rates, and briefs over years, not seconds.',
  keywords: [
    'Production Brain', 'ABRAM Workspace Memory', 'AI production memory',
    'crew matching scores', 'vector RAG search', 'data security',
    'creative agency AI co-pilot', 'brief analyzer scoping',
  ],
  alternates: {
    canonical: 'https://docs.abram.network/production-brain',
  },
  openGraph: {
    title: 'Production Brain — Enterprise Workspace Memory | ABRAM Network',
    description: 'A private, secure workspace intelligence engine that learns crew preferences, rates, and briefs over years, not seconds.',
    type: 'website',
    url: 'https://docs.abram.network/production-brain',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Production Brain — Enterprise Workspace Memory | ABRAM Network',
    description: 'A private, secure workspace intelligence engine that learns crew preferences, rates, and briefs over years, not seconds.',
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
            '@type': 'WebPage',
            name: 'ABRAM Production Brain',
            description: 'Workspace memory and AI capabilities in the ABRAM creative production platform.',
            url: 'https://docs.abram.network/production-brain',
            isPartOf: { '@id': 'https://docs.abram.network/#website' },
            publisher: { '@id': 'https://abram.network/#organization' },
            mainEntity: {
              '@type': 'SoftwareApplication',
              name: 'ABRAM',
              applicationCategory: 'BusinessApplication',
              featureList: [
                'Unified Workspace Memory RAG',
                'Secured Row-Level Security Isolated Scopes',
                'Interactive Action Plan Approvals',
                'Suitability Index Calculation Sliders',
                'Continuous Passive Data Learning',
              ],
            },
          }).replace(/</g, '\\u003c'),
        }}
      />
      <main className="bg-[#0A0A0A] min-h-screen text-zinc-100 overflow-x-hidden pt-16 select-none relative z-10 isolate">
        
        {/* Tech grid overlay */}
        <div className="absolute inset-0 tech-grid-overlay opacity-[0.15] pointer-events-none z-0" />

        {/* Subtle svg film grain overlay from styling rules */}
        <div className="grain-overlay pointer-events-none fixed inset-0 z-50 opacity-[0.02]" />

        {/* Section 1: Hero */}
        <div className="relative">
          {/* Indigo-950/20 glow behind Hero */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-950/20 rounded-full blur-[140px] pointer-events-none animate-breathe z-0" />
          <div className="relative z-10">
            <HeroSection />
          </div>
        </div>

        {/* Neural connection line split */}
        <div className="max-w-7xl mx-auto px-6 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent relative z-10" />

        {/* Section 2: Interactive Sandbox */}
        <div className="relative py-24 md:py-36">
          {/* Blue-950/15 glow behind Sandbox */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-950/15 rounded-full blur-[140px] pointer-events-none animate-breathe z-0" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-3">CO-PILOT INTERFACE</span>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-50 font-sans mb-4">Conversational Scoping Sandbox</h2>
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-950/15 rounded-full blur-[140px] pointer-events-none animate-breathe z-0" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-3">MEMORY ARCHITECTURE</span>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-50 font-sans mb-4">Dual-Scope Memory Architecture</h2>
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-950/10 rounded-full blur-[140px] pointer-events-none animate-breathe z-0" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-3">ZERO INPUT</span>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-50 font-sans mb-4">Continuous Background Indexing</h2>
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-950/10 rounded-full blur-[140px] pointer-events-none animate-breathe z-0" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-3">MATCHMAKING SCORING</span>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-50 font-sans mb-4">Weighted Suitability Scores</h2>
              <p className="text-zinc-400 leading-relaxed text-base font-sans">
                Find the perfect fit for your roles. Adjust the sliders below to see how suitability scores shift in real-time based on your priority weights.
              </p>
            </div>
            <MatchmakingEngine />
          </div>
        </div>

        {/* Section 6: Under the Hood */}
        <div className="relative py-24 md:py-36">
          {/* Slate-900/15 glow behind Under the Hood */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-slate-900/15 rounded-full blur-[140px] pointer-events-none animate-breathe z-0" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 block mb-3">SYSTEM ARCHITECTURE</span>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-50 font-sans mb-4">Under the Hood</h2>
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
