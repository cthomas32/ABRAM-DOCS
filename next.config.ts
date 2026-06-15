import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: {
    appIsrStatus: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
  outputFileTracingIncludes: {
    "/docs": ["./index.mdx", "./docs.json"],
    "/docs/[...slug]": ["./user-guide/**/*", "./content/**/*", "./docs.json"],
  },
};

export default nextConfig;
