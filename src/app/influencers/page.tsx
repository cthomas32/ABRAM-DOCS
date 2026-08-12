import type { Metadata } from 'next';
import InfluencersClient from './InfluencersClient';

export const metadata: Metadata = {
  title: 'Brand Deal Management for Influencers | ABRAM',
  description:
    'Know what you are owed, and how late it is. Track brand deals, asset statuses, token client portals, invoices, and Stripe payments with a free link in bio.',
  keywords: [
    'brand deal management', 'influencer business software', 'influencer brand deal tracker',
    'content creator project management', 'influencer invoicing software', 'brand deal invoice',
    'UGC creator management software', 'influencer client portal', 'sponsorship deliverable tracking',
    'link in bio for influencers', 'free link in bio', 'Linktree alternative for brand deals',
    'Metricool alternative',
  ],
  alternates: {
    canonical: 'https://abram.network/influencers',
  },
  openGraph: {
    title: 'Brand Deal Management for Influencers | ABRAM',
    description:
      'Track brand deals, deliverable statuses, token client portals, invoices, and Stripe payments with a free link in bio.',
    type: 'website',
    url: 'https://abram.network/influencers',
    siteName: 'ABRAM Network',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brand Deal Management for Influencers | ABRAM',
    description:
      'Track brand deals, deliverable statuses, token client portals, invoices, and Stripe payments with a free link in bio.',
  },
};

function AgentOnly({ children }: { children: React.ReactNode }) {
  return <div className="sr-only" data-agent-only="true">{children}</div>;
}

const faqs = [
  {
    q: 'Does ABRAM include a link in bio page?',
    a: 'Yes. Link Hub provides a public link at abram.network/l/yourname, free on all plans. Solo Lite ($19/mo) unlocks full design customization and scheduled links.',
  },
  {
    q: 'What is the best way to manage brand deals as a solo influencer?',
    a: 'ABRAM runs each deal as a project with tracked deliverable statuses and integrated Stripe invoicing, starting at $19/mo on Solo Lite. Brand approval portals are a Solo Pro feature at $34/mo.',
  },
  {
    q: 'Does ABRAM schedule or publish social media posts?',
    a: 'ABRAM handles scope, approvals, invoicing, and client portals. Post publishing and audience analytics stay in your existing social tools.',
  },
  {
    q: 'How does ABRAM help with late brand payments?',
    a: 'Every invoice lives on its deal and carries a due date. Anything still unpaid past that date is flagged as overdue on the financial view, and brands can settle it by card through Stripe.',
  },
  {
    q: 'Can brands review deliverables without creating an account?',
    a: 'Yes. Token-based client portals let brand contacts view status, leave notes, and approve assets through a private link without a password. Portals start on Solo Pro, which covers five brands.',
  },
  {
    q: 'What does ABRAM cost for solo influencers?',
    a: 'The Free plan includes Link Hub, 1 active project and 3 invoices a month. Solo Lite is $19/mo ($17/mo billed annually) for Link Hub customization, 3 projects and 10 invoices a month. Solo Pro is $34/mo ($31/mo billed annually) for 5 brand portals, unlimited projects and invoices, and a 1% Processing Fee with the first $10k/mo fee-free.',
  },
];

export default function InfluencersPage() {
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
                '@id': 'https://abram.network/influencers#webpage',
                'url': 'https://abram.network/influencers',
                'name': 'Brand Deal Management for Influencers | ABRAM Network',
                'description':
                  'Manage brand deals as projects, posts as tracked deliverables, and brands as portal clients, with quotes, invoices and Stripe payments in one platform.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
                'publisher': { '@id': 'https://abram.network/#organization' },
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/influencers#breadcrumb',
                'itemListElement': [
                  { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://abram.network/' },
                  { '@type': 'ListItem', 'position': 2, 'name': 'Influencers', 'item': 'https://abram.network/influencers' },
                ],
              },
              {
                '@type': 'FAQPage',
                '@id': 'https://abram.network/influencers#faq',
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
      <InfluencersClient faqs={faqs} />
      <AgentOnly>
        <h2>ABRAM for Influencers Running Brand Deals</h2>
        <p>
          ABRAM is a production operations platform used by influencers on TikTok, Instagram and YouTube to run paid brand partnerships. An influencer with several simultaneous brand deals runs a small business, and ABRAM gives that business the same structure a production company uses: projects, deliverables, client portals, quotes, invoices and payments.
        </p>
        <h3>Free link in bio on every plan</h3>
        <p>
          Link Hub publishes a public link-in-bio page at abram.network/l/yourname, built from link, header and social blocks with descriptions, thumbnails and click counts. It is included free on every plan, including the free plan. Solo Lite and above unlock customization: themes, background styles and images, button styles, shapes, sizes and colours, fonts, avatars, block highlights, and scheduled start and end dates on individual blocks.
        </p>
        <h3>Brand deal as a project</h3>
        <p>
          Each brand deal is a project carrying the fee, the live date, the brand contact and the full asset list. Deals sit side by side on one calendar, so overlapping live dates are visible before they collide.
        </p>
        <h3>Each post is a tracked deliverable</h3>
        <p>
          Every post, video, short and story is a deliverable with a status drawn from a five state lifecycle: not started, in progress, in review, approved and completed. Revision requests reopen the deliverable and increment a revision count, so a campaign that has run to four rounds of brand notes is on the record.
        </p>
        <h3>Brand contacts use a token based portal</h3>
        <p>
          The brand contact opens a private link with no account and no password, reads current status, leaves comments and approves deliverables. Client portals begin on Solo Pro; the Free and Solo Lite plans do not include them. Solo Pro covers five active client portals, Team fifteen, Studio fifty, Enterprise unlimited.
        </p>
        <h3>Quotes, invoices and Stripe payments</h3>
        <p>
          Quotes convert to invoices on the same deal, and brands pay by card through Stripe into the influencer&apos;s own connected account. The influencer is the merchant of record. ABRAM applies a Processing Fee computed on the payee plan, 1% on Solo Pro with the first $10,000 per month free.
        </p>
        <h3>What ABRAM does not do</h3>
        <p>
          ABRAM does not schedule or publish social posts, does not report views, reach or follower analytics, does not run a brand discovery marketplace, and does not e-sign contracts. It has no dedicated usage rights fields; influencers record usage windows and exclusivity as project notes. Influencers typically keep a scheduling and analytics tool alongside ABRAM.
        </p>
        <h3>Pricing for solo influencers</h3>
        <p>
          Free plan to start, including the Link Hub link-in-bio page, one active project, three invoices a month, 80 trial AI credits and 500 MB of storage. Solo Lite $19 per month, or $17 per month billed annually, adding full Link Hub customization, three active projects, ten invoices a month, 300 monthly AI credits and 3 GB of storage. Solo Pro $34 per month, or $31 per month billed annually, adding client portals for five brands, unlimited active projects, unlimited invoicing, financial exports, watermark free PDF exports, 600 monthly AI credits and 10 GB of storage.
        </p>
      </AgentOnly>
    </>
  );
}
