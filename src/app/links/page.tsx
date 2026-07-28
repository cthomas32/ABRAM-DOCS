import type { Metadata } from "next";
import Image from "next/image";
import { supabase } from "@/utils/supabase/static";
import { DEFAULT_SETTINGS, type LinkHubLink, type LinkHubSettings } from "@/lib/linkHub";
import LinkHubList from "@/components/links/LinkHubList";

/**
 * The public link hub: one shareable URL for a social bio, listing
 * whatever links are currently published from the admin panel.
 */

export const revalidate = 60;

const TITLE = "ABRAM Links";
const DESCRIPTION =
  "Every ABRAM link in one place: start free, explore the platform by discipline, see pricing, or read the guides.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://abram.network/links" },
  openGraph: {
    title: `${TITLE} | ABRAM Network`,
    description: DESCRIPTION,
    type: "website",
    url: "https://abram.network/links",
    siteName: "ABRAM Network",
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | ABRAM Network`,
    description: DESCRIPTION,
  },
};

async function getLinkHub(): Promise<{ links: LinkHubLink[]; settings: LinkHubSettings }> {
  const [linksResult, settingsResult] = await Promise.all([
    supabase
      .from("link_hub_links")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("link_hub_settings").select("*").limit(1).maybeSingle(),
  ]);

  if (linksResult.error) {
    console.error("Link hub: failed to load links:", linksResult.error.message);
  }
  if (settingsResult.error) {
    console.error("Link hub: failed to load settings:", settingsResult.error.message);
  }

  return {
    links: (linksResult.data as LinkHubLink[] | null) || [],
    settings: (settingsResult.data as LinkHubSettings | null) || DEFAULT_SETTINGS,
  };
}

export default async function LinksPage() {
  const { links, settings } = await getLinkHub();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "@id": "https://abram.network/links#webpage",
            url: "https://abram.network/links",
            name: `${TITLE} | ABRAM Network`,
            description: DESCRIPTION,
            isPartOf: { "@id": "https://abram.network/#website" },
            mainEntity: {
              "@type": "ItemList",
              itemListElement: links.map((link, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: link.label,
                url: link.url.startsWith("/") ? `https://abram.network${link.url}` : link.url,
              })),
            },
          }).replace(/</g, "\\u003c"),
        }}
      />

      <div className="relative w-full px-4 sm:px-6 pt-24 pb-20 sm:pt-28">
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[300px] h-[220px] md:w-[560px] md:h-[320px] bg-gradient-to-b from-[#8ECAFF]/8 via-[#3B82F6]/4 to-transparent rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg mx-auto">
          {/* Identity */}
          <div className="flex flex-col items-center text-center mb-9">
            <Image
              src="/favicon.png"
              alt=""
              aria-hidden="true"
              width={64}
              height={64}
              priority
              className="rounded-2xl border border-white/10 mb-5"
            />
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white text-balance">
              {settings.heading}
            </h1>
            <p className="mt-2.5 text-sm text-zinc-400 leading-relaxed max-w-sm text-pretty">
              {settings.subheading}
            </p>
          </div>

          <LinkHubList links={links} />

          {settings.footer_note ? (
            <p className="mt-8 text-center text-xs text-zinc-600 leading-relaxed text-pretty">
              {settings.footer_note}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
