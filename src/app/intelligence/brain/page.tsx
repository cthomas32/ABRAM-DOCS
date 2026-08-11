import type { Metadata } from 'next';
import HeroSection from '@/components/production-brain/HeroSection';
import CopilotSandbox from '@/components/production-brain/CopilotSandbox';
import ActionPlan from '@/components/production-brain/ActionPlan';
import PassiveLearning from '@/components/production-brain/PassiveLearning';
import EstimateLearning from '@/components/production-brain/EstimateLearning';

export const metadata: Metadata = {
  title: 'ABRAM, the Core AI for Creative Production',
  description: 'ABRAM is the core AI for production: ask in plain language, approve actions, and build a Production Brain that remembers crews, rates, and estimates.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'core AI for production', 'ABRAM Copilot', 'conversational production AI',
    'Production Brain', 'ABRAM workspace memory', 'AI production memory',
    'interactive action plans', 'crew matchmaking', 'brief intelligence',
    'estimate calibration', 'crew roster alignment', 'workspace search', 'data security',
    'creative agency AI copilot', 'screenplay parser', 'stripboard schedule optimization',
  ],
  alternates: {
    canonical: 'https://abram.network/intelligence/brain',
  },
  openGraph: {
    title: 'ABRAM, the Core AI for Creative Production | ABRAM Network',
    description: 'Ask in plain language, approve actions, and build a Production Brain that remembers crews, rates, and estimates.',
    type: 'website',
    url: 'https://abram.network/intelligence/brain',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ABRAM, the Core AI for Creative Production | ABRAM Network',
    description: 'Ask in plain language, approve actions, and build a Production Brain that remembers crews, rates, and estimates.',
  },
};

function AgentOnly({ children }: { children: React.ReactNode }) {
  return <div className="sr-only" data-agent-only="true">{children}</div>;
}

export default function CoreAIPage() {
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
                'name': 'ABRAM, the Core AI for Creative Production | ABRAM Network',
                'description': 'ABRAM is the core AI for creative production, combining a conversational copilot, approve-before-execute action plans, a persistent Production Brain memory, and self-calibrating estimates.',
                'url': 'https://abram.network/intelligence/brain',
                'isPartOf': { '@id': 'https://abram.network/#website' },
                'publisher': { '@id': 'https://abram.network/#organization' },
                'mainEntity': {
                  '@type': 'SoftwareApplication',
                  'name': 'ABRAM',
                  'applicationCategory': 'BusinessApplication',
                  'featureList': [
                    'Conversational Production Copilot',
                    'Interactive Action Plan Approvals',
                    'Approve-Before-Execute Safety Guardrails',
                    'Production Brain Institutional Memory',
                    'Continuous Passive Data Learning',
                    'Estimate Calibration Against Project Actuals',
                    'Crew Matchmaking and Roster Suitability Scores',
                    'Brief Intelligence and Screenplay Parsing',
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
                    'name': 'ABRAM, the Core AI',
                    'item': 'https://abram.network/intelligence/brain'
                  }
                ]
              }
            ]
          }).replace(/</g, '\\u003c'),
        }}
      />
      <main className="text-zinc-100 overflow-x-hidden pt-16 select-none relative z-10 isolate">

        {/* Hero (user-approved, unchanged) */}
        <div className="relative">
          {/* Indigo-950/20 glow behind Hero */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[500px] md:h-[500px] rounded-full blur-[40px] md:blur-[60px] pointer-events-none z-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(30, 27, 75, 0.25) 0%, rgba(30, 27, 75, 0.2025) 10%, rgba(30, 27, 75, 0.16) 20%, rgba(30, 27, 75, 0.1225) 30%, rgba(30, 27, 75, 0.09) 40%, rgba(30, 27, 75, 0.0625) 50%, rgba(30, 27, 75, 0.04) 60%, rgba(30, 27, 75, 0.0225) 70%, rgba(30, 27, 75, 0.01) 80%, rgba(30, 27, 75, 0.0025) 90%, rgba(30, 27, 75, 0) 100%)' }}
          />
          <div className="relative z-10">
            <HeroSection />
          </div>
        </div>

        {/* Neural connection line split */}
        <div className="max-w-7xl mx-auto px-6 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent relative z-10" />

        {/* 01 · ASK — Copilot chat experience */}
        <div id="sandbox-section" className="relative py-24 md:py-36 scroll-mt-24">
          {/* Blue-950/15 glow behind Sandbox */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[550px] md:h-[550px] rounded-full blur-[40px] md:blur-[60px] pointer-events-none z-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(23, 37, 84, 0.2) 0%, rgba(23, 37, 84, 0.162) 10%, rgba(23, 37, 84, 0.128) 20%, rgba(23, 37, 84, 0.098) 30%, rgba(23, 37, 84, 0.072) 40%, rgba(23, 37, 84, 0.05) 50%, rgba(23, 37, 84, 0.032) 60%, rgba(23, 37, 84, 0.018) 70%, rgba(23, 37, 84, 0.008) 80%, rgba(23, 37, 84, 0.002) 90%, rgba(23, 37, 84, 0) 100%)' }}
          />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-block font-sans">
                <span className="text-zinc-600">01</span> ASK
              </span>
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 font-sans mb-4">Ask ABRAM for anything.</h2>
              <p className="text-zinc-400 leading-relaxed text-base font-sans">
                ABRAM Copilot parses documents and drafts a plan while you talk it through.
              </p>
            </div>
            <CopilotSandbox />
          </div>
        </div>

        {/* 02 · IT ACTS — approve-before-execute action plans */}
        <div className="relative py-24 md:py-36">
          {/* Emerald glow behind Action Plan */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[500px] md:h-[500px] rounded-full blur-[40px] md:blur-[60px] pointer-events-none z-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(6, 78, 59, 0.16) 0%, rgba(6, 78, 59, 0.12) 20%, rgba(6, 78, 59, 0.07) 40%, rgba(6, 78, 59, 0.035) 60%, rgba(6, 78, 59, 0.01) 80%, rgba(6, 78, 59, 0) 100%)' }}
          />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-block font-sans">
                <span className="text-zinc-600">02</span> IT ACTS
              </span>
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 font-sans mb-4">ABRAM turns that plan into real work you approve first.</h2>
              <p className="text-zinc-400 leading-relaxed text-base font-sans">
                Every action waits in a pending plan until you sign off, so nothing runs behind your back.
              </p>
            </div>
            <ActionPlan />
          </div>
        </div>

        {/* 03 · IT REMEMBERS — Production Brain passive learning */}
        <div className="relative py-24 md:py-36">
          {/* Violet-950/10 glow behind Passive Learning */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[500px] md:h-[500px] rounded-full blur-[40px] md:blur-[60px] pointer-events-none z-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(46, 16, 101, 0.14) 0%, rgba(46, 16, 101, 0.1134) 10%, rgba(46, 16, 101, 0.0896) 20%, rgba(46, 16, 101, 0.0686) 30%, rgba(46, 16, 101, 0.0504) 40%, rgba(46, 16, 101, 0.035) 50%, rgba(46, 16, 101, 0.0224) 60%, rgba(46, 16, 101, 0.0126) 70%, rgba(46, 16, 101, 0.0056) 80%, rgba(46, 16, 101, 0.0014) 90%, rgba(46, 16, 101, 0) 100%)' }}
          />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-block font-sans">
                <span className="text-zinc-600">03</span> IT REMEMBERS
              </span>
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 font-sans mb-4">It knows your whole studio and everyone you work with.</h2>
              <p className="text-zinc-400 leading-relaxed text-base font-sans">
                General AI assistants start from zero every chat. Your Brain is scoped to your workspace and compounds while your team works.
              </p>
            </div>
            <PassiveLearning />
          </div>
        </div>

        {/* 04 · IT LEARNS — estimate calibration */}
        <div className="relative py-24 md:py-36">
          {/* Red-950/10 glow behind Estimate Learning */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[550px] md:h-[550px] rounded-full blur-[40px] md:blur-[60px] pointer-events-none z-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(69, 10, 10, 0.14) 0%, rgba(69, 10, 10, 0.1134) 10%, rgba(69, 10, 10, 0.0896) 20%, rgba(69, 10, 10, 0.0686) 30%, rgba(69, 10, 10, 0.0504) 40%, rgba(69, 10, 10, 0.035) 50%, rgba(69, 10, 10, 0.0224) 60%, rgba(69, 10, 10, 0.0126) 70%, rgba(69, 10, 10, 0.0056) 80%, rgba(69, 10, 10, 0.0014) 90%, rgba(69, 10, 10, 0) 100%)' }}
          />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-block font-sans">
                <span className="text-zinc-600">04</span> IT LEARNS
              </span>
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 font-sans mb-4">Every corner of your operation gets sharper over time.</h2>
              <p className="text-zinc-400 leading-relaxed text-base font-sans">
                Estimates are one example. It also learns real task hours and who delivers them, building a dataset only you own.
              </p>
            </div>
            <EstimateLearning />
          </div>
        </div>

        {/* Final CTA */}
        <div className="relative py-24 md:py-32 border-t border-white/5">
          <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3 inline-block font-sans">
              GET STARTED
            </span>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 font-sans mb-4">Put the core AI for creative production to work today.</h2>
            <p className="text-zinc-400 leading-relaxed text-base font-sans mb-8">
              Start a workspace and let ABRAM build your Production Brain from day one.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://app.abram.network"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glass rounded-full px-4 py-1.5 text-xs"
              >
                Get Started
              </a>
              <a
                href="/pricing"
                className="btn-glass rounded-full px-4 py-1.5 text-xs"
              >
                View Pricing
              </a>
            </div>
          </div>
        </div>

      </main>
      <AgentOnly>
        <h2>ABRAM: The Core AI Copilot & Production Brain for Creative Operations</h2>
        <p>
          ABRAM is the core AI assistant purpose-built for film production and creative agency operations. Ask in natural language to parse briefs, generate stripboard schedules, query crew availability, and execute workspace actions with human approval.
        </p>
        <p>[ABRAM] [isCategory] [Core AI for Creative Production]</p>
        <p>[ABRAM] [hasFeature] [Approve-Before-Execute Guardrails]</p>
        <p>[Production Brain] [remembers] [Workspace Crew Roster & Rates]</p>
      </AgentOnly>
    </>
  );
}
