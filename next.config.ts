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
   * Every address the console has ever had still resolves.
   *
   * Two rounds of restructuring are folded in here. The first turned nine
   * pages into four objects and four tab hubs. The second gave each object
   * one address and each record a page of its own, which moved People out
   * from under /crm and renamed Accounts to Companies.
   *
   * The word "people" used to mean two things: the CRM list at /crm/people
   * and the team access screen at /people. That collision is what made
   * four buttons on the people screen land on the team screen, and it is
   * why /admin/dashboard/people no longer redirects anywhere. It is the
   * People list. Team access is reached at /team?tab=access, which it
   * always also was.
   *
   * Temporary rather than permanent on purpose: a 308 is cached by the
   * browser forever, and these shapes are weeks old.
   */
  async redirects() {
    return [
      /* The demo library was briefly at /videos. Nothing external points
         there, but the footer did for an afternoon and a bookmark costs
         nothing to honour. Temporary, because a 308 is cached by the
         browser forever and this shape is days old. */
      { source: "/videos", destination: "/demos", permanent: false },
      /* People, and everything that used to hang off /crm. The longer
         sources are listed before the bare one because Next takes the
         first match and /crm would otherwise swallow /crm/capture. */
      { source: "/admin/dashboard/crm/people", destination: "/admin/dashboard/people", permanent: false },
      { source: "/admin/dashboard/crm/capture", destination: "/admin/dashboard/capture", permanent: false },
      { source: "/admin/dashboard/crm/compose", destination: "/admin/dashboard/people/compose", permanent: false },
      { source: "/admin/dashboard/crm/design", destination: "/admin/dashboard/people/design", permanent: false },
      { source: "/admin/dashboard/crm/print", destination: "/admin/dashboard/people/print", permanent: false },
      { source: "/admin/dashboard/crm/emails", destination: "/admin/dashboard/people/emails", permanent: false },
      { source: "/admin/dashboard/crm", destination: "/admin/dashboard/people", permanent: false },
      { source: "/admin/dashboard/contacts", destination: "/admin/dashboard/people", permanent: false },
      { source: "/admin/dashboard/people-crm", destination: "/admin/dashboard/people", permanent: false },
      { source: "/admin/dashboard/lists", destination: "/admin/dashboard/people?tab=lists", permanent: false },
      { source: "/admin/dashboard/sequences", destination: "/admin/dashboard/people?tab=sequences", permanent: false },
      /* Subscribers is gone as an object. A subscriber is a person whose
         lifecycle says so, and the built-in list on the people screen is
         where they are now. */
      { source: "/admin/dashboard/subscribers", destination: "/admin/dashboard/people?tab=list", permanent: false },

      /* Companies. The old name was Accounts, which is also what the table
         is still called, so this one runs in the direction you would not
         guess from the schema. */
      { source: "/admin/dashboard/accounts", destination: "/admin/dashboard/companies", permanent: false },

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
