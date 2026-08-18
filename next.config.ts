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
   * The console's navigation was regrouped and two rows were renamed:
   * Contacts became People and Accounts became Companies. The URLs did
   * not move — renaming a route to match a label is how bookmarks and
   * pasted links die — so these are aliases for the names people now
   * read in the sidebar and will type into the address bar.
   */
  async redirects() {
    return [
      { source: "/admin/dashboard/contacts", destination: "/admin/dashboard/crm", permanent: false },
      { source: "/admin/dashboard/people-crm", destination: "/admin/dashboard/crm", permanent: false },
      { source: "/admin/dashboard/companies", destination: "/admin/dashboard/accounts", permanent: false },
      { source: "/admin/dashboard/board", destination: "/admin/dashboard/deals/board", permanent: false },
      { source: "/admin/dashboard/access", destination: "/admin/dashboard/people", permanent: false },
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
