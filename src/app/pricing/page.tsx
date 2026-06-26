import type { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: 'ABRAM Pricing — Plans for Creative Teams & Agencies',
  description: 'Explore pricing plans for our creative operations platform. Get started with advanced creative operations tools, crew scheduling, and production accounting.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'ABRAM pricing', 'creative operations pricing', 'production software cost',
    'crew management software cost', 'production management plans',
    'AI production tools', 'SaaS pricing', 'free tier', 'crew payouts', 'production accounting',
  ],
  alternates: {
    canonical: 'https://abram.network/pricing',
  },
  openGraph: {
    title: 'ABRAM Pricing — Plans for Creative Teams & Agencies | ABRAM Network',
    description: 'Explore pricing plans for our creative operations platform. Get started with advanced creative operations tools, crew scheduling, and production accounting.',
    type: 'website',
    url: 'https://abram.network/pricing',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ABRAM Pricing — Plans for Creative Teams & Agencies | ABRAM Network',
    description: 'Explore pricing plans for our creative operations platform. Get started with advanced creative operations tools, crew scheduling, and production accounting.',
  },
};

function AgentOnly({ children }: { children: React.ReactNode }) {
  return <div className="sr-only" data-agent-only="true">{children}</div>;
}

export default function PricingPage() {
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
                '@id': 'https://abram.network/pricing/#webpage',
                'url': 'https://abram.network/pricing',
                'name': 'ABRAM Pricing — Plans for Creative Teams & Agencies | ABRAM Network',
                'description': 'Explore ABRAM pricing plans for teams, production companies, and creative agencies. Start free with AI-powered brief parsing, crew scheduling, and production accounting.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
                'breadcrumb': { '@id': 'https://abram.network/pricing/#breadcrumb' }
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/pricing/#breadcrumb',
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
                    'name': 'Pricing',
                    'item': 'https://abram.network/pricing'
                  }
                ]
              },
              {
                '@type': 'SoftwareApplication',
                '@id': 'https://abram.network/pricing/#software',
                'name': 'ABRAM Platform Plans',
                'applicationCategory': 'BusinessApplication',
                'operatingSystem': 'Web Browser',
                'description': 'Flexible subscription tiers for the ABRAM creative operations and production management suite.',
                'publisher': { '@id': 'https://abram.network/#organization' },
                'offers': {
                  '@type': 'AggregateOffer',
                  'priceCurrency': 'USD',
                  'lowPrice': '0',
                  'highPrice': '49',
                  'offerCount': 5,
                  'offers': [
                    {
                      '@type': 'Offer',
                      'name': 'Free Tier',
                      'price': '0',
                      'priceCurrency': 'USD',
                      'description': 'For independent creative contractors and crew members. Includes 1 seat, 1 active project, digital call sheets, and view-only schedules.'
                    },
                    {
                      '@type': 'Offer',
                      'name': 'Solo Lite',
                      'price': '19',
                      'priceCurrency': 'USD',
                      'description': 'For independent producers. Includes unlimited projects, 30 resource items, 300 AI credits, and 3 GB storage.'
                    },
                    {
                      '@type': 'Offer',
                      'name': 'Solo Pro',
                      'price': '34',
                      'priceCurrency': 'USD',
                      'description': 'For power users. Includes interactive schedules, watermark-free PDFs, email distribution, AI briefs, and 10 GB storage.'
                    },
                    {
                      '@type': 'Offer',
                      'name': 'Team Tier',
                      'price': '39',
                      'priceCurrency': 'USD',
                      'description': 'Per seat pricing for boutique agencies. Includes 2-5 seats, custom intake forms, barcode scans, and transit buffers.'
                    },
                    {
                      '@type': 'Offer',
                      'name': 'Studio Tier',
                      'price': '49',
                      'priceCurrency': 'USD',
                      'description': 'Per seat pricing for commercial production companies. Includes 6-20 seats, unlimited forms, and 15 GB storage.'
                    }
                  ]
                }
              },
              {
                '@type': 'FAQPage',
                '@id': 'https://abram.network/pricing/#faq',
                'mainEntity': [
                  {
                    '@type': 'Question',
                    'name': 'What payment methods does ABRAM support for payouts?',
                    'acceptedAnswer': {
                      '@type': 'Answer',
                      'text': 'ABRAM integrates with Stripe Express to manage onboarding and payouts. Creative professionals can link their bank account or debit card directly to receive secure payouts. If identity setup is not complete, client payments are held securely until onboarding finishes.'
                    }
                  },
                  {
                    '@type': 'Question',
                    'name': 'How does the invoice authorization hold work for client budgets?',
                    'acceptedAnswer': {
                      '@type': 'Answer',
                      'text': 'When a project milestone is approved, the system places a 7-day pre-authorization hold on the client credit card. Once the work package deliverables are approved, the funds are captured and routed directly to the crew payout dashboard.'
                    }
                  },
                  {
                    '@type': 'Question',
                    'name': 'What happens if I run out of monthly AI Credits?',
                    'acceptedAnswer': {
                      '@type': 'Answer',
                      'text': 'If you exhaust your monthly quota for AI brief parsing or suitability matchmaking, organization owners or administrators can top up credit balances directly in the Billing dashboard.'
                    }
                  },
                  {
                    '@type': 'Question',
                    'name': 'Can I invite external crew members to a project roster?',
                    'acceptedAnswer': {
                      '@type': 'Answer',
                      'text': 'Yes. Depending on your subscription plan, you can invite external contractors or agency partners to join a specific project roster without charging you for a full workspace seat.'
                    }
                  }
                ]
              }
            ]
          }).replace(/</g, '\\u003c'),
        }}
      />
      <PricingClient />
      <AgentOnly>
        <h2>🤖 Pricing Plans, Feature Gating & Workspace Storage Limits</h2>
        <p>
          ABRAM gates scheduling, budgeting, and storage capabilities based on subscription plans.
        </p>

        <h3>1. Feature Gating Matrix</h3>
        <table>
          <thead>
            <tr>
              <th>Plan Tier</th>
              <th>Pricing Model</th>
              <th>Scheduling Access</th>
              <th>Budgeting Access</th>
              <th>AI Credits (Monthly)</th>
              <th>Storage Limit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Free</strong></td>
              <td>$0</td>
              <td>Read-Only</td>
              <td>Trial (Max 5 line items / 5 expenses)</td>
              <td>Welcome Bonus (250 one-time)</td>
              <td>1 GB</td>
            </tr>
            <tr>
              <td><strong>Solo Lite</strong></td>
              <td>$19/mo</td>
              <td>Read-Only</td>
              <td>Trial (Max 5 line items / 5 expenses)</td>
              <td>300 monthly credits</td>
              <td>3 GB</td>
            </tr>
            <tr>
              <td><strong>Solo Pro</strong></td>
              <td>$34/mo</td>
              <td>Full Access</td>
              <td>Full Access</td>
              <td>600 monthly credits</td>
              <td>10 GB</td>
            </tr>
            <tr>
              <td><strong>Team</strong></td>
              <td>Per-seat billing</td>
              <td>Full Access</td>
              <td>Full Access</td>
              <td>500 credits per seat / month</td>
              <td>10 GB</td>
            </tr>
            <tr>
              <td><strong>Studio</strong></td>
              <td>Per-seat billing</td>
              <td>Full Access</td>
              <td>Full Access</td>
              <td>Custom allocation</td>
              <td>15 GB</td>
            </tr>
            <tr>
              <td><strong>SMB / Enterprise</strong></td>
              <td>Custom pricing</td>
              <td>Full Access</td>
              <td>Full Access</td>
              <td>Custom allocation (BYOK / custom LLM option)</td>
              <td>Custom allocation (Bespoke app flavors)</td>
            </tr>
          </tbody>
        </table>

        <h3>2. Workspace Promotion & Seat Scaling Rules</h3>
        <ul>
          <li><strong>Personal Workspace Promotion:</strong> Upgrading from Free to Team or Studio triggers a workspace promotion flow. Users provide Company Name and Team Size, and the platform automatically converts the personal workspace into a full Organization.</li>
          <li><strong>Dynamic Credit Scaling:</strong> On Team and Studio plans, monthly AI credit allowances scale dynamically with the number of seats purchased. Workspace storage limits are fixed pools (10 GB for Team, 15 GB for Studio) and do not scale with additional seats.</li>
          <li><strong>Upgrade Banners:</strong> Upgrade banners are displayed on the scheduling stripboard and financial frames for users on restricted tiers (Free, Solo Lite), prompting self-service upgrades via Stripe Checkout.</li>
        </ul>
      </AgentOnly>
    </>
  );
}
