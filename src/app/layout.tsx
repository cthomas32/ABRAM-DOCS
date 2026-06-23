import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import AppLayout from "@/components/AppLayout";
import LenisProvider from "@/components/LenisProvider";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://abram.network'),
  title: {
    default: 'ABRAM Network — The AI Platform for Creative Intelligence',
    template: '%s | ABRAM Network',
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
    siteName: 'ABRAM Network',
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} h-full antialiased dark`}>
      <body className="min-h-full bg-background-base text-foreground font-sans">
        <script
          id="consent-default"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              
              var consentPrefs = null;
              try {
                var saved = localStorage.getItem('abram-consent-v2');
                if (saved) {
                  consentPrefs = JSON.parse(saved);
                }
              } catch (e) {}
              
              var defaultConsent = {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied'
              };
              
              if (consentPrefs) {
                defaultConsent.ad_storage = consentPrefs.ad_storage ? 'granted' : 'denied';
                defaultConsent.ad_user_data = consentPrefs.ad_user_data ? 'granted' : 'denied';
                defaultConsent.ad_personalization = consentPrefs.ad_personalization ? 'granted' : 'denied';
                defaultConsent.analytics_storage = consentPrefs.analytics_storage ? 'granted' : 'denied';
              }
              
              gtag('consent', 'default', defaultConsent);
            `
          }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KCDWS029PK"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KCDWS029PK');
          `}
        </Script>
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
                  'name': 'ABRAM Network',
                  'url': 'https://abram.network',
                  'logo': {
                    '@type': 'ImageObject',
                    'url': 'https://abram.network/logo/dark.svg',
                    'width': '112',
                    'height': '28'
                  },
                  'image': 'https://abram.network/og-image.png',
                  'description': 'ABRAM is the AI-powered platform for creative production management, crew scheduling, talent matchmaking, and automated invoicing.',
                  'sameAs': [
                    'https://x.com/abramnetwork',
                    'https://linkedin.com/company/abram-network'
                  ]
                },
                {
                  '@type': 'WebApplication',
                  '@id': 'https://app.abram.network/#application',
                  'name': 'ABRAM App',
                  'applicationCategory': 'BusinessApplication',
                  'operatingSystem': 'Web Browser',
                  'browserRequirements': 'Requires HTML5, CSS3, and JavaScript enabled. Compatible with Chrome, Safari, Firefox, and Edge.',
                  'description': 'Web-based application workspace for managing creative agency and studio production logistics, scheduling, and billing.',
                  'offers': {
                    '@type': 'Offer',
                    'price': '0',
                    'priceCurrency': 'USD',
                    'description': 'Free tier available with credit-based usage'
                  },
                  'publisher': { '@id': 'https://abram.network/#organization' }
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://abram.network/#website',
                  'name': 'ABRAM Network',
                  'url': 'https://abram.network',
                  'description': 'Official portal, documentation, and help center for the ABRAM platform.',
                  'publisher': { '@id': 'https://abram.network/#organization' },
                  'potentialAction': {
                    '@type': 'SearchAction',
                    'target': {
                      '@type': 'EntryPoint',
                      'urlTemplate': 'https://abram.network/docs?q={search_term_string}'
                    },
                    'query-input': 'required name=search_term_string'
                  }
                }
              ]
            }).replace(/</g, '\\u003c'),
          }}
        />
      </body>
    </html>
  );
}
