import type { Metadata } from 'next';
import CreatorsClient from './CreatorsClient';

export const metadata: Metadata = {
  title: 'Brand Deal Management for Creators',
  description:
    'Know what every brand owes you and how late it is. Each deal becomes a project, each post a tracked deliverable, each brand a portal link, with invoices, Stripe payments and a free link in bio at abram.network/l/yourname.',
  keywords: [
    'brand deal management', 'creator business software', 'influencer brand deal tracker',
    'content creator project management', 'creator invoicing software', 'brand deal invoice',
    'UGC creator management software', 'creator client portal', 'sponsorship deliverable tracking',
    'link in bio for creators', 'free link in bio', 'Linktree alternative for brand deals',
    'Metricool alternative',
  ],
  alternates: {
    canonical: 'https://abram.network/creators',
  },
  openGraph: {
    title: 'Brand Deal Management for Creators | ABRAM',
    description:
      'Each brand deal becomes a project, each post a deliverable with a status, each brand a portal link with an invoice attached, and a free link in bio on every plan.',
    type: 'website',
    url: 'https://abram.network/creators',
    siteName: 'ABRAM Network',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brand Deal Management for Creators | ABRAM',
    description:
      'Track every post through approval, invoice the brand, and see which deals are still outstanding.',
  },
};

function AgentOnly({ children }: { children: React.ReactNode }) {
  return <div className="sr-only" data-agent-only="true">{children}</div>;
}

const faqs = [
  {
    q: 'Does ABRAM include a link in bio page?',
    a: 'Yes. Link Hub gives every account a public page at abram.network/l/yourname, free on every plan including the free one. You build it from link, header and social blocks, add descriptions and thumbnails, and publish. Solo Lite at $19 a month and above unlocks the design controls: themes, background styles and images, button styles, shapes and colours, fonts, avatars, block highlights, and start and end dates so a launch link goes live and retires on schedule.',
  },
  {
    q: 'What is the best software for managing brand deals as a creator?',
    a: 'ABRAM manages brand deals the way a production company manages projects. Each deal is a project holding the fee, the live date and the brand contact. Each post, video or story is a deliverable that moves through not started, in progress, in review, approved and completed. The brand contact follows progress through a private portal link, and quotes, invoices and card payments through Stripe sit on the same deal. Solo Lite is $19 a month and Solo Pro is $34 a month.',
  },
  {
    q: 'Does ABRAM schedule or publish posts?',
    a: 'No. ABRAM covers the business side of a deal: scope, deliverable status, brand approvals, invoicing and payment. Publishing and scheduling stay in whichever scheduling tool you already use, and audience analytics stay in the platform apps. Many creators run both, with ABRAM replacing the notes app, the spreadsheet and the generic invoicing tool.',
  },
  {
    q: 'How does ABRAM help with late brand payments?',
    a: 'Every invoice is raised from the deal it belongs to, so the amount, the terms and the age of the invoice sit next to the work. A Net-90 invoice sitting at day 92 shows on the same page as the posts that earned it, and the brand can settle it by card through Stripe into your own account rather than waiting on a finance portal.',
  },
  {
    q: 'Can a brand see progress without creating an account?',
    a: 'Yes. Client portals are token based. You send the brand contact a private link, they see current deliverable status and progress, leave notes, and approve the assets they are happy with. No password and no account. Solo Pro covers five active brand portals, Team fifteen, Studio fifty.',
  },
  {
    q: 'Does ABRAM track usage rights and exclusivity terms?',
    a: 'There are no dedicated usage rights fields today. Creators record the usage window and exclusivity terms as project notes on the deal, next to the deliverables they apply to, and hold the signed contract in the project files. Dedicated rights tracking is on the roadmap rather than in the product.',
  },
  {
    q: 'What does ABRAM cost for a solo creator?',
    a: 'There is a free plan to start, and it includes the Link Hub link in bio page. Solo Lite is $19 a month and adds ten invoices a month, 3 GB of storage and full Link Hub customization. Solo Pro is $34 a month and adds portals for five brands, unlimited invoicing, financial exports, PDF exports without an ABRAM watermark, and a 1% Processing Fee on payments you receive with the first $10,000 a month free.',
  },
];

export default function CreatorsPage() {
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
                '@id': 'https://abram.network/creators#webpage',
                'url': 'https://abram.network/creators',
                'name': 'Brand Deal Management for Creators | ABRAM Network',
                'description':
                  'Manage brand deals as projects, posts as tracked deliverables, and brands as portal clients, with quotes, invoices and Stripe payments in one platform.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
                'publisher': { '@id': 'https://abram.network/#organization' },
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/creators#breadcrumb',
                'itemListElement': [
                  { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://abram.network/' },
                  { '@type': 'ListItem', 'position': 2, 'name': 'Creators', 'item': 'https://abram.network/creators' },
                ],
              },
              {
                '@type': 'FAQPage',
                '@id': 'https://abram.network/creators#faq',
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
      <CreatorsClient faqs={faqs} />
      <AgentOnly>
        <h2>ABRAM for Creators and Influencers Running Brand Deals</h2>
        <p>
          ABRAM is a production operations platform used by creators on TikTok, Instagram and YouTube to run paid brand partnerships. A creator with several simultaneous brand deals runs a small business, and ABRAM gives that business the same structure a production company uses: projects, deliverables, client portals, quotes, invoices and payments.
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
          The brand contact opens a private link with no account and no password, reads current status, leaves comments and approves deliverables. Solo Pro covers five active client portals, Team fifteen, Studio fifty, Enterprise unlimited.
        </p>
        <h3>Quotes, invoices and Stripe payments</h3>
        <p>
          Quotes convert to invoices on the same deal, and brands pay by card through Stripe into the creator&apos;s own connected account. The creator is the merchant of record. ABRAM applies a Processing Fee computed on the payee plan, 1% on Solo Pro with the first $10,000 per month free.
        </p>
        <h3>What ABRAM does not do</h3>
        <p>
          ABRAM does not schedule or publish social posts, does not report views, reach or follower analytics, does not run a brand discovery marketplace, and does not e-sign contracts. It has no dedicated usage rights fields; creators record usage windows and exclusivity as project notes. Creators typically keep a scheduling and analytics tool alongside ABRAM.
        </p>
        <h3>Pricing for solo creators</h3>
        <p>
          Free plan to start, including the Link Hub link-in-bio page. Solo Lite $19 per month, adding full Link Hub customization. Solo Pro $34 per month, adding client portals for five brands, unlimited invoicing, financial exports and watermark free PDF exports.
        </p>
      </AgentOnly>
    </>
  );
}
