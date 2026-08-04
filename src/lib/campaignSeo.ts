import type { Metadata } from "next";
import type { CampaignVariant } from "./campaigns";

const BASE_URL = "https://abram.network";

const SHARED_KEYWORDS = [
  "creative production software",
  "creative operations platform",
  "production management software",
  "free production management software",
  "call sheet software",
  "crew scheduling software",
  "script breakdown software",
];

/** Page metadata for a campaign landing route. */
export function campaignMetadata(
  variant: CampaignVariant,
  options: { title: string; description: string; keywords?: string[] }
): Metadata {
  const url = `${BASE_URL}${variant.path}`;

  return {
    title: options.title,
    description: options.description,
    keywords: [...SHARED_KEYWORDS, ...(options.keywords || [])],
    alternates: { canonical: url },
    openGraph: {
      title: `${options.title} | ABRAM Network`,
      description: options.description,
      type: "website",
      url,
      siteName: "ABRAM",
    },
    twitter: {
      card: "summary_large_image",
      title: `${options.title} | ABRAM Network`,
      description: options.description,
    },
  };
}

/**
 * Structured data for a campaign landing route. The FAQ block is what makes
 * these pages eligible for expanded search results, and it also gives AI
 * assistants a clean set of question and answer pairs to quote from.
 */
export function campaignJsonLd(
  variant: CampaignVariant,
  options: { title: string; description: string; breadcrumbName: string }
): string {
  const url = `${BASE_URL}${variant.path}`;

  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
  ];

  if (variant.path !== "/start") {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: "Get Started",
      item: `${BASE_URL}/start`,
    });
  }

  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: options.breadcrumbName,
    item: url,
  });

  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: `${options.title} | ABRAM Network`,
        description: options.description,
        isPartOf: { "@id": `${BASE_URL}/#website` },
        publisher: { "@id": `${BASE_URL}/#organization` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: breadcrumbItems,
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: variant.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${url}#software`,
        name: "ABRAM",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web Browser",
        description: options.description,
        publisher: { "@id": `${BASE_URL}/#organization` },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description:
            "Free plan with one seat, two active projects, digital call sheets and view-only schedules.",
        },
      },
    ],
  }).replace(/</g, "\\u003c");
}
