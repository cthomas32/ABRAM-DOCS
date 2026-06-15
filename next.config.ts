import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: {
    appIsrStatus: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any,
};

export default nextConfig;
