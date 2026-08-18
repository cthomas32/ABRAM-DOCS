import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    formats: ["image/avif", "image/webp"],
    // The image library. The files are uploads of our own work, served
    // from the public bucket the social cards already draw them from, and
    // the site now puts the same pictures behind sections. One host, named
    // rather than wildcarded: this is the only project this site reads.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fovvtmwmrivuwnqemcil.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  productionBrowserSourceMaps: true,
  devIndicators: {
    appIsrStatus: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  /**
   * The console became object-first, and nine pages became four objects
   * and four tab hubs. Every address that existed before still resolves,
   * because a console people have had open for weeks is full of tabs,
   * bookmarks and pasted links, and a 404 is a worse answer than a jump.
   *
   * Temporary rather than permanent on purpose: a 308 is cached by the
   * browser forever, and this shape is one week old.
   */
  async redirects() {
    return [
      /* People, and the three screens that are now tabs on it. */
      { source: "/admin/dashboard/contacts", destination: "/admin/dashboard/crm/people", permanent: false },
      { source: "/admin/dashboard/people-crm", destination: "/admin/dashboard/crm/people", permanent: false },
      { source: "/admin/dashboard/crm", destination: "/admin/dashboard/crm/people", permanent: false },
      { source: "/admin/dashboard/lists", destination: "/admin/dashboard/crm/people?tab=lists", permanent: false },
      { source: "/admin/dashboard/sequences", destination: "/admin/dashboard/crm/people?tab=sequences", permanent: false },
      /* Subscribers is gone as an object. A subscriber is a person whose
         lifecycle says so, and the built-in list on the people screen is
         where they are now. */
      { source: "/admin/dashboard/subscribers", destination: "/admin/dashboard/crm/people?tab=list", permanent: false },

      /* Companies. */
      { source: "/admin/dashboard/companies", destination: "/admin/dashboard/accounts", permanent: false },

      /* Deals, and its three former siblings. */
      { source: "/admin/dashboard/board", destination: "/admin/dashboard/deals?tab=board", permanent: false },
      { source: "/admin/dashboard/deals/board", destination: "/admin/dashboard/deals?tab=board", permanent: false },
      { source: "/admin/dashboard/registrations", destination: "/admin/dashboard/deals?tab=registrations", permanent: false },

      /* Activities. */
      { source: "/admin/dashboard/tasks", destination: "/admin/dashboard/activities?tab=tasks", permanent: false },

      /* Growth tools. */
      { source: "/admin/dashboard/broadcasts", destination: "/admin/dashboard/growth?tab=email", permanent: false },
      { source: "/admin/dashboard/promotions", destination: "/admin/dashboard/growth?tab=promos", permanent: false },
      { source: "/admin/dashboard/campaigns", destination: "/admin/dashboard/growth?tab=pages", permanent: false },
      { source: "/admin/dashboard/social", destination: "/admin/dashboard/growth?tab=social", permanent: false },
      { source: "/admin/dashboard/links", destination: "/admin/dashboard/growth?tab=links", permanent: false },

      /* Content. */
      { source: "/admin/dashboard/blog", destination: "/admin/dashboard/content?tab=blog", permanent: false },
      { source: "/admin/dashboard/docs", destination: "/admin/dashboard/content?tab=docs", permanent: false },
      { source: "/admin/dashboard/changelog", destination: "/admin/dashboard/content?tab=changelog", permanent: false },

      /* Money. /admin/dashboard/revenue is deliberately absent: it stays a
         real address because the collections sync is being built on it. */
      { source: "/admin/dashboard/earnings", destination: "/admin/dashboard/money?tab=earnings", permanent: false },
      { source: "/admin/dashboard/reports", destination: "/admin/dashboard/money?tab=reports", permanent: false },

      /* Team. */
      { source: "/admin/dashboard/access", destination: "/admin/dashboard/team?tab=access", permanent: false },
      { source: "/admin/dashboard/people", destination: "/admin/dashboard/team?tab=access", permanent: false },
    ];
  },
  outputFileTracingIncludes: {
    "/docs": ["./index.mdx", "./docs.json"],
    "/docs/[...slug]": ["./user-guide/**/*", "./content/**/*", "./docs.json"],
    "/privacy-policy": ["./user-guide/ABRAM_Privacy_Policy.md"],
    "/terms-of-use": ["./user-guide/ABRAM_Terms_of_Use.md"],
    "/acceptable-use-policy": ["./user-guide/ABRAM_Acceptable_Use_Policy.md"],
  },
};

export default nextConfig;
