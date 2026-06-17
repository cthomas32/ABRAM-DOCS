import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import AppLayout from "@/components/AppLayout";
import LenisProvider from "@/components/LenisProvider";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.abram.network'),
  title: {
    default: 'ABRAM Docs — AI-Powered Creative Production Platform',
    template: '%s | ABRAM Docs',
  },
  description: 'Official documentation and help center for ABRAM Network — the AI-powered platform for creative production management, crew scheduling, talent matchmaking, and automated invoicing.',
  keywords: [
    'ABRAM', 'ABRAM Network', 'creative production management', 'AI platform',
    'crew scheduling', 'talent matchmaking', 'freelancer invoicing', 'production management software',
    'creative agency tools', 'AI brief analyzer', 'work order management', 'crew management',
    'production workflow', 'help center', 'documentation',
  ],
  authors: [{ name: 'ABRAM Network', url: 'https://abram.network' }],
  creator: 'ABRAM Network',
  publisher: 'ABRAM Network',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32x32.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'ABRAM Docs',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ABRAM — The AI Platform for Creative Intelligence' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://docs.abram.network',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-background-base text-foreground font-sans">
        <LenisProvider>
          <AppLayout>{children}</AppLayout>
        </LenisProvider>
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://abram.network/#organization',
                  name: 'ABRAM Network',
                  url: 'https://abram.network',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://docs.abram.network/logo/dark.svg',
                  },
                  description: 'ABRAM is the AI-powered platform for creative production management — project intake, crew scheduling, talent matchmaking, and automated invoicing for brands and freelancers.',
                },
                {
                  '@type': 'WebApplication',
                  '@id': 'https://app.abram.network/#application',
                  name: 'ABRAM',
                  applicationCategory: 'BusinessApplication',
                  operatingSystem: 'Web Browser',
                  description: 'AI-powered creative production management platform for brands and freelancers.',
                  offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'USD',
                    description: 'Free tier available with AI credits',
                  },
                  publisher: { '@id': 'https://abram.network/#organization' },
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://docs.abram.network/#website',
                  name: 'ABRAM Docs',
                  url: 'https://docs.abram.network',
                  description: 'Official documentation and help center for ABRAM Network.',
                  publisher: { '@id': 'https://abram.network/#organization' },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: 'https://docs.abram.network/docs?q={search_term_string}',
                    },
                    'query-input': 'required name=search_term_string',
                  },
                },
              ],
            }).replace(/</g, '\\u003c'),
          }}
        />
      </body>
    </html>
  );
}
