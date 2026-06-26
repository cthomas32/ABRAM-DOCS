import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
