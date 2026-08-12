import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNetworkSupabase } from "@/utils/supabase/network";
import {
  normalizeImageUrl,
  normalizeLink,
  normalizeSettings,
  type LinkHubLink,
  type LinkHubSettings,
} from "@/lib/linkHub";
import LinkPageView from "@/components/linkPage/LinkPageView";

/**
 * A creator's link-in-bio page — one per organization in the abram-network
 * product, published from that app's Link Hub installable app and read
 * here through two public views (public_link_pages / public_link_blocks) in
 * that project's Supabase, a different project from this repo's own.
 *
 * Renders bare, full-bleed, with no site navigation or footer — see the
 * /l/ case added to AppLayout's isBarePage, same treatment as /links and
 * /c/<slug>. Deliberately kept out of the sitemap and out of the search
 * index: these are user pages, not marketing pages, and the abram-network
 * app is the place their owners manage them, not this repo.
 */

export const revalidate = 60;

interface LinkPageProps {
  params: Promise<{ slug: string }>;
}

interface PageResult {
  settings: LinkHubSettings;
  blocks: LinkHubLink[];
  shareUrl: string;
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

async function getLinkPage(rawSlug: string): Promise<PageResult | null> {
  const slug = rawSlug.trim().toLowerCase();
  if (!SLUG_PATTERN.test(slug)) return null;

  const client = getNetworkSupabase();
  if (!client) return null;

  const [pageResult, blocksResult] = await Promise.all([
    client.from("public_link_pages").select("*").eq("slug", slug).maybeSingle(),
    client
      .from("public_link_blocks")
      .select("*")
      .eq("slug", slug)
      .order("sort_order", { ascending: true }),
  ]);

  if (pageResult.error) {
    console.error("Link page: failed to load page:", pageResult.error.message);
  }
  if (blocksResult.error) {
    console.error("Link page: failed to load blocks:", blocksResult.error.message);
  }

  if (!pageResult.data) return null;

  return {
    settings: normalizeSettings(pageResult.data as Partial<LinkHubSettings>),
    blocks: ((blocksResult.data as (Partial<LinkHubLink> & { id: string })[] | null) || []).map(
      normalizeLink,
    ),
    shareUrl: `https://abram.network/l/${slug}`,
  };
}

export async function generateMetadata({ params }: LinkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLinkPage(slug);

  // Matches /c/<slug>: a per-creator page is never indexed or crawled for
  // links out, whether or not it exists.
  const noIndex = { index: false, follow: false } as const;

  if (!page) {
    return { title: "Page not found", robots: noIndex };
  }

  const title = page.settings.seo_title?.trim() || page.settings.heading || "ABRAM";
  const description = page.settings.seo_description?.trim() || page.settings.subheading || undefined;

  // The owner's share image if they set one, otherwise their avatar — a bio
  // link is pasted into chats far more often than it is crawled, and a card
  // with a face on it is the difference between a tap and a scroll past.
  // Normalized, not passed through: this value comes from a text column and
  // ends up in a meta tag.
  const shareImage =
    normalizeImageUrl(page.settings.og_image_url || "") ||
    (page.settings.avatar_kind === "image"
      ? normalizeImageUrl(page.settings.avatar_url || "")
      : null);

  // A wide custom image earns a large card; a fallback avatar is square and
  // would be cropped into nonsense by one.
  const cardType = page.settings.og_image_url ? "summary_large_image" : "summary";

  return {
    title,
    description,
    robots: noIndex,
    alternates: { canonical: page.shareUrl },
    openGraph: {
      title,
      description,
      type: "website",
      url: page.shareUrl,
      ...(shareImage ? { images: [{ url: shareImage }] } : {}),
    },
    twitter: {
      card: cardType,
      title,
      description,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
  };
}

export default async function LinkPage({ params }: LinkPageProps) {
  const { slug } = await params;
  const page = await getLinkPage(slug);

  if (!page) notFound();

  return (
    <LinkPageView
      slug={slug.trim().toLowerCase()}
      settings={page.settings}
      blocks={page.blocks}
      shareUrl={page.shareUrl}
    />
  );
}
