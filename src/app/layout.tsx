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
  description: 'Official documentation and help center for ABRAM Network — the AI-powered creative operations platform and project management software. Streamline crew scheduling, equipment allocation, script breakdown, and production accounting.',
  keywords: [
    'creative production software', 'creative production tools', 'creative operations platform',
    'creative ops platform', 'creative ops tools', 'ABRAM', 'ABRAM Network',
    'creative production management', 'AI platform',
    'crew scheduling', 'crew roster management', 'crew payouts', 'production management software',
    'creative agency tools', 'AI brief analyzer', 'work order management', 'crew management',
    'production workflow', 'help center', 'documentation',
    'Movie Magic alternative', 'StudioBinder alternative', 'Adobe Workfront alternative',
    'Jira for creative production', 'StudioBinder replacement',
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
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ABRAM Network — The AI Platform for Creative Intelligence' }],
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
    types: {
      'text/markdown': [
        {
          url: 'https://abram.network/llms.txt',
          title: 'ABRAM Network LLMs.txt Platform Specification',
        },
      ],
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
              
              var eeaRegions = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH', 'LI', 'NO', 'IS'];
              
              var eeaConsent = {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied',
                'region': eeaRegions
              };
              
              var otherConsent = {
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted',
                'analytics_storage': 'granted'
              };
              
              var saved = null;
              try {
                var savedStr = localStorage.getItem('abram-consent-v2');
                if (savedStr) {
                  saved = JSON.parse(savedStr);
                }
              } catch (e) {}
              
              if (saved) {
                var resolvedAdStorage = saved.ad_storage ? 'granted' : 'denied';
                var resolvedAdUserData = saved.ad_user_data ? 'granted' : 'denied';
                var resolvedAdPersonalization = saved.ad_personalization ? 'granted' : 'denied';
                var resolvedAnalyticsStorage = saved.analytics_storage ? 'granted' : 'denied';
                
                eeaConsent.ad_storage = resolvedAdStorage;
                eeaConsent.ad_user_data = resolvedAdUserData;
                eeaConsent.ad_personalization = resolvedAdPersonalization;
                eeaConsent.analytics_storage = resolvedAnalyticsStorage;
                
                otherConsent.ad_storage = resolvedAdStorage;
                otherConsent.ad_user_data = resolvedAdUserData;
                otherConsent.ad_personalization = resolvedAdPersonalization;
                otherConsent.analytics_storage = resolvedAnalyticsStorage;
              }
              
              gtag('consent', 'default', eeaConsent);
              gtag('consent', 'default', otherConsent);
              
              var finalAdStorageDenied = saved ? !saved.ad_storage : true;
              if (finalAdStorageDenied) {
                gtag('set', 'ads_data_redaction', true);
              }
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
                  'description': 'ABRAM is the AI-powered platform for creative operations and production management, enabling crew scheduling, roster management, and production accounting.',
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
                },
                {
                  "@type": "ItemList",
                  "@id": "https://abram.network/#navigation",
                  "name": "Main Navigation Menu",
                  "description": "Main platform hubs and navigation links for ABRAM Network.",
                  "itemListElement": [
                    {
                      "@type": "SiteNavigationElement",
                      "position": 1,
                      "name": "Film Production Hub",
                      "description": "AI-powered film production suite for script breakdown, budgeting, scheduling, and digital call sheets.",
                      "url": "https://abram.network/film-production"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 2,
                      "name": "Creative Agency Operations",
                      "description": "Creative operations hub for client intake, crew rosters, and smart scheduling.",
                      "url": "https://abram.network/agency"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 3,
                      "name": "Creative Intelligence Suite",
                      "description": "AI co-pilots, ROI engines, and brief intelligence for operationally-driven workflows.",
                      "url": "https://abram.network/intelligence"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 4,
                      "name": "Platform Pricing Plans",
                      "description": "Flexible and credit-based pricing tiers for creative teams and agencies.",
                      "url": "https://abram.network/pricing"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 5,
                      "name": "ABRAM Network Blog",
                      "description": "Insights, stories, and articles about the future of film production and creative operations.",
                      "url": "https://abram.network/blog"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 6,
                      "name": "Product Changelog",
                      "description": "Latest updates, feature releases, and system updates for the ABRAM platform.",
                      "url": "https://abram.network/changelog"
                    },
                    {
                      "@type": "SiteNavigationElement",
                      "position": 7,
                      "name": "Help Guides & Documentation",
                      "description": "Comprehensive help guides, tutorials, and system documentation for users.",
                      "url": "https://abram.network/docs"
                    }
                  ]
                }
              ]
            }).replace(/</g, '\\u003c'),
          }}
        />
      </body>
    </html>
  );
}
