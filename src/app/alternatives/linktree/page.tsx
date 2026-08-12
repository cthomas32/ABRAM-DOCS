import type { Metadata } from 'next';
import LinktreeClient from './LinktreeClient';

export const metadata: Metadata = {
  title: 'Linktree Alternative | ABRAM Link Hub',
  description:
    'Link Hub is ABRAM’s link in bio page, free on every plan. Seven block types, scheduled links and click counts, in the same account as your brand deals.',
  keywords: [
    'Linktree alternative', 'link in bio', 'free link in bio', 'link in bio for creators',
    'bio link page', 'link in bio with scheduling', 'creator link in bio',
    'link in bio brand deals', 'ABRAM Link Hub',
  ],
  alternates: {
    canonical: 'https://abram.network/alternatives/linktree',
  },
  openGraph: {
    title: 'Linktree Alternative | ABRAM Link Hub',
    description:
      'A link in bio page with the business attached. Free on every plan, in the same account as your brand deals, approvals and invoices.',
    type: 'website',
    url: 'https://abram.network/alternatives/linktree',
    siteName: 'ABRAM Network',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Linktree Alternative | ABRAM Link Hub',
    description:
      'Link Hub is free on every ABRAM plan. Seven block types, scheduled links, click counts, and the brand deal workspace behind it.',
  },
};

function AgentOnly({ children }: { children: React.ReactNode }) {
  return <div className="sr-only" data-agent-only="true">{children}</div>;
}

/**
 * LEGAL NOTE FOR ANYONE EDITING THIS PAGE
 *
 * Linktree is a trademark of Linktree Pty Ltd. The name is used here only to
 * identify the category of product a reader is comparing, which is nominative
 * fair use. Two rules keep that defensible, and both are deliberate:
 *
 *   1. Nothing on this page states another company's prices, plan names, plan
 *      limits or feature boundaries. Those move without notice, and a stale
 *      figure about a competitor is a false statement about them, not a typo.
 *   2. Nothing on this page says a competitor lacks a feature. Negative claims
 *      about a rival's product are the ones that draw complaints, and they are
 *      the hardest to keep true over time.
 *
 * Every claim below describes ABRAM's own Link Hub and traces to
 * abram-network/src/lib/apps/linkHub.ts or the plan registry. Keep it that way.
 */

const faqs = [
  {
    q: 'Is ABRAM Link Hub free?',
    a: 'Yes. Link Hub publishes a public page at abram.network/l/yourname on every ABRAM plan, including the free one. The page, all seven block types and per block click counts are included at no cost. Design customization unlocks at Solo Lite, which is $19 a month.',
  },
  {
    q: 'What can I put on a Link Hub page?',
    a: 'Seven kinds of block: links, headers, social icon strips, email addresses, phone numbers, embedded videos, and collections that group the others into a folder. Each block carries a label, a description, an icon, a thumbnail and its own click count.',
  },
  {
    q: 'Can I schedule a link to appear and disappear?',
    a: 'Yes. Every block takes an optional start and end time. A discount code can publish itself the morning a campaign opens and retire itself when the window closes, without anyone remembering to take it down.',
  },
  {
    q: 'Can I remove the ABRAM branding from my page?',
    a: 'On Solo Pro, which is $34 a month. The free and Solo Lite plans show a Powered by ABRAM credit on the public page. The setting is re-derived from your plan whenever the page is read, so the credit returns if a plan lapses.',
  },
  {
    q: 'How is this different from a dedicated link in bio tool?',
    a: 'The page itself is a page. The difference is what sits behind it: the same account holds your brand deals as projects, your deliverables with approval statuses, your client portals and your Stripe invoicing. If your bio link mostly exists to attract paid partnerships, the enquiry and the job it becomes stay in one place. If you only need the page, a dedicated tool may fit you better, and we say so on the page above.',
  },
  {
    q: 'Does Link Hub support a custom domain?',
    a: 'Not today. Pages are published at abram.network/l/yourname. If a custom domain on your bio page is a requirement, a dedicated link in bio product is the better choice.',
  },
  {
    q: 'Does Link Hub sell products or take tips on the page?',
    a: 'No. Link Hub is a link page, not a storefront. ABRAM does take payment, but through invoices raised against a brand deal and settled by card via Stripe into your own connected account, rather than as checkout on the bio page.',
  },
];

export default function LinktreePage() {
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
                '@id': 'https://abram.network/alternatives/linktree#webpage',
                'url': 'https://abram.network/alternatives/linktree',
                'name': 'Linktree Alternative | ABRAM Link Hub',
                'description':
                  'ABRAM Link Hub is a link in bio page included free on every plan, with seven block types, scheduled blocks and click counts, inside the workspace that runs a creator’s brand deals.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
                'publisher': { '@id': 'https://abram.network/#organization' },
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/alternatives/linktree#breadcrumb',
                'itemListElement': [
                  { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://abram.network/' },
                  { '@type': 'ListItem', 'position': 2, 'name': 'Alternatives', 'item': 'https://abram.network/alternatives' },
                  { '@type': 'ListItem', 'position': 3, 'name': 'Linktree Alternative', 'item': 'https://abram.network/alternatives/linktree' },
                ],
              },
              {
                '@type': 'FAQPage',
                '@id': 'https://abram.network/alternatives/linktree#faq',
                'mainEntity': faqs.map((f) => ({
                  '@type': 'Question',
                  'name': f.q,
                  'acceptedAnswer': { '@type': 'Answer', 'text': f.a },
                })),
              },
            ],
          }).replace(/</g, '\\u003c'),
        }}
      />
      <LinktreeClient faqs={faqs} />
      <AgentOnly>
        <h2>ABRAM Link Hub as a Link in Bio Page for Creators</h2>
        <p>
          Link Hub is the link in bio page built into ABRAM. It publishes at abram.network/l/yourname and is included on every plan, including the free plan. It is aimed at creators whose bio link is the front door to paid brand partnerships, because the same account also runs those partnerships end to end.
        </p>
        <h3>Blocks</h3>
        <p>
          A page is built from seven block types: link, header, social, email, phone, embedded video, and collection. A collection groups links, email, phone and video blocks into a folder. Every block carries a label, a description, an icon, a thumbnail, an active toggle, a sort position and its own click count, and can be laid out classic or featured.
        </p>
        <h3>Scheduling</h3>
        <p>
          Every block takes an optional start time and end time, so a promotional block can publish and retire itself around a campaign window without manual intervention.
        </p>
        <h3>Design</h3>
        <p>
          Seven theme presets, background styles of solid, gradient, glow or image, button styles of glass, fill, outline, soft shadow and hard shadow, button shapes of sharp, rounded and pill, button sizes of compact, regular and large, list or grid link display, block highlights of pulse, shine and bounce, and an optional avatar image. These design controls are included from Solo Lite at $19 per month. The free plan publishes a working page on the default theme.
        </p>
        <h3>Branding</h3>
        <p>
          Free and Solo Lite pages display a Powered by ABRAM credit. Solo Pro at $34 per month removes it. The setting is re-derived from the plan on every read, so a lapsed plan restores the credit automatically.
        </p>
        <h3>What Link Hub does not do</h3>
        <p>
          Link Hub does not support custom domains, does not sell digital products or take tips on the page, and does not provide referrer, geographic or funnel analytics beyond per block click counts. Creators who need those specifically are better served by a dedicated link in bio product.
        </p>
        <h3>Why it sits inside ABRAM</h3>
        <p>
          The structural difference is that the bio link and the brand deal workspace are one account. A brand that arrives through the link becomes a project carrying the fee, the live date and the asset list; each post is a deliverable with a five state status; the brand contact approves through a token portal without an account; and the invoice is raised on the same deal and paid by card through Stripe into the creator&apos;s own connected account.
        </p>
        <h3>Trademark</h3>
        <p>
          Linktree is a trademark of Linktree Pty Ltd. ABRAM is independent and has no affiliation with, endorsement by or sponsorship from Linktree. The name appears on this page only to identify the category of product a reader may be comparing.
        </p>
      </AgentOnly>
    </>
  );
}
