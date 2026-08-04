import type { Metadata } from "next";
import { supabase } from "@/utils/supabase/static";
import {
  absoluteLinkUrl,
  isLinkLive,
  normalizeImageUrl,
  normalizeLink,
  normalizeSettings,
  type LinkHubLink,
  type LinkHubSettings,
} from "@/lib/linkHub";
import LinkHubView from "@/components/links/LinkHubView";

/**
 * The public link hub: one shareable URL for a social bio, listing
 * whatever blocks are currently published and in schedule.
 *
 * The route renders bare, with no site navigation or footer, so the page
 * is nothing but the links.
 */

export const revalidate = 60;

const PAGE_URL = "https://abram.network/links";
const FALLBACK_TITLE = "ABRAM Links";
const FALLBACK_DESCRIPTION =
  "Every ABRAM link in one place: start free, explore the platform by discipline, see pricing, or read the guides.";

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
    links: ((linksResult.data as LinkHubLink[] | null) || []).map(normalizeLink),
    settings: normalizeSettings(settingsResult.data as Partial<LinkHubSettings> | null),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getLinkHub();

  const title = settings.seo_title?.trim() || FALLBACK_TITLE;
  const description = settings.seo_description?.trim() || settings.subheading || FALLBACK_DESCRIPTION;
  const image = settings.og_image_url ? normalizeImageUrl(settings.og_image_url) : null;

  return {
    title,
    description,
    alternates: { canonical: PAGE_URL },
    openGraph: {
      title: `${title} | ABRAM Network`,
      description,
      type: "website",
      url: PAGE_URL,
      siteName: "ABRAM",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ABRAM Network`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function LinksPage() {
  const { links, settings } = await getLinkHub();
  const live = links.filter((link) => isLinkLive(link));
  const destinations = live.filter((link) => link.block_type !== "header");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "@id": `${PAGE_URL}#webpage`,
            url: PAGE_URL,
            name: `${settings.seo_title?.trim() || FALLBACK_TITLE} | ABRAM Network`,
            description: settings.seo_description?.trim() || settings.subheading,
            isPartOf: { "@id": "https://abram.network/#website" },
            mainEntity: {
              "@type": "ItemList",
              itemListElement: destinations.map((link, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: link.label,
                url: absoluteLinkUrl(link.url),
              })),
            },
          }).replace(/</g, "\\u003c"),
        }}
      />

      <LinkHubView links={live} settings={settings} shareUrl={PAGE_URL} />
    </>
  );
}
