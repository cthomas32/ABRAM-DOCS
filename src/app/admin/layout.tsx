import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ABRAM Admin Console",
  description: "Internal administrative dashboard for ABRAM Network.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
