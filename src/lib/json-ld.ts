export interface OrganizationSchema {
  '@context': string;
  '@type': string;
  '@id': string;
  name: string;
  legalName: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
}

export interface WebSiteSchema {
  '@context': string;
  '@type': string;
  '@id': string;
  name: string;
  alternateName?: string | string[];
  url: string;
  potentialAction: {
    '@type': string;
    target: {
      '@type': string;
      urlTemplate: string;
    };
    'query-input': string;
  };
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQPageSchema {
  '@context': string;
  '@type': string;
  mainEntity: Array<{
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }>;
}

export interface HowToStep {
  name: string;
  text: string;
  url?: string;
}

export interface HowToSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  step: Array<{
    '@type': string;
    position: number;
    name: string;
    text: string;
    url?: string;
  }>;
}

export function getOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://abram.network/#organization',
    name: 'ABRAM Network',
    legalName: 'Thomas Abram, LLC',
    url: 'https://abram.network',
    logo: 'https://abram.network/ABRAM_Logo_Black@48x48px.png',
    description: 'ABRAM is a creative production management platform that unifies screenplay parsing, stripboard scheduling, client brief intake, crew matchmaking, SAG-AFTRA turnaround compliance tracking, and Stripe Connect payouts.',
    sameAs: [
      'https://twitter.com/abramnetwork',
      'https://github.com/cthomas32/ABRAM-DOCS',
      'https://app.abram.network',
    ],
  };
}

export function getWebSiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://abram.network/#website',
    name: 'ABRAM Network',
    alternateName: ['ABRAM', 'abram.network'],
    url: 'https://abram.network',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://abram.network/docs?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function getSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': 'https://abram.network/#softwareapplication',
    name: 'ABRAM',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Cloud / Web Browser',
    url: 'https://abram.network',
    description: 'Cloud-native creative operations and film production platform featuring automated script breakdown, stripboard scheduling, digital call sheets, SAG rest window checking, and Stripe Connect crew payouts.',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '49',
      offerCount: '5',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free Workspace',
          price: '0',
          priceCurrency: 'USD',
          url: 'https://app.abram.network',
        },
        {
          '@type': 'Offer',
          name: 'Solo Lite',
          price: '19',
          priceCurrency: 'USD',
          url: 'https://abram.network/pricing',
        },
        {
          '@type': 'Offer',
          name: 'Solo Pro',
          price: '34',
          priceCurrency: 'USD',
          url: 'https://abram.network/pricing',
        },
        {
          '@type': 'Offer',
          name: 'Team',
          price: '39',
          priceCurrency: 'USD',
          url: 'https://abram.network/pricing',
        },
        {
          '@type': 'Offer',
          name: 'Studio',
          price: '49',
          priceCurrency: 'USD',
          url: 'https://abram.network/pricing',
        },
      ],
    },
    publisher: {
      '@type': 'Organization',
      '@id': 'https://abram.network/#organization',
    },
  };
}

export function getFAQPageSchema(faqs: FAQItem[]): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function getHowToSchema(name: string, description: string, steps: HowToStep[]): HowToSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((s, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: s.name,
      text: s.text,
      ...(s.url ? { url: s.url } : {}),
    })),
  };
}
