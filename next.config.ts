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
  outputFileTracingIncludes: {
    "/docs": ["./index.mdx", "./docs.json"],
    "/docs/[...slug]": ["./user-guide/**/*", "./content/**/*", "./docs.json"],
    "/privacy-policy": ["./user-guide/ABRAM_Privacy_Policy.md"],
    "/terms-of-use": ["./user-guide/ABRAM_Terms_of_Use.md"],
    "/acceptable-use-policy": ["./user-guide/ABRAM_Acceptable_Use_Policy.md"],
  },
};

export default nextConfig;
