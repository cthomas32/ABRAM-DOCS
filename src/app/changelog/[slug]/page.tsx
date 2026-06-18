import type { Metadata } from "next";
import { supabase } from "@/utils/supabase/static";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/MdxComponents";
import Link from "next/link";
import { cache } from "react";

export const revalidate = 60; // Revalidate page cache every 60 seconds (ISR)

interface ChangelogDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const getRelease = cache(async (slug: string) => {
  try {
    // 1. Try to fetch by slug
    const { data: releaseBySlug } = await supabase
      .from("release_notes")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (releaseBySlug) {
      return releaseBySlug;
    }

    // 2. Try to fetch by version number fallback (slugified version -> dots)
    const versionCandidate = slug.replace(/^v/i, "").replace(/-/g, ".");
    const { data: releaseByVersion } = await supabase
      .from("release_notes")
      .select("*")
      .or(`version.eq.${versionCandidate},version.eq.v${versionCandidate}`)
      .eq("status", "published")
      .maybeSingle();

    if (releaseByVersion) {
      return releaseByVersion;
    }

    // 3. Try to fetch by ID fallback if it is a valid UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
      const { data: releaseById } = await supabase
        .from("release_notes")
        .select("*")
        .eq("id", slug)
        .eq("status", "published")
        .maybeSingle();

      if (releaseById) {
        return releaseById;
      }
    }

    return null;
  } catch (err) {
    console.error("Error fetching release note:", err);
    return null;
  }
});

export async function generateStaticParams() {
  try {
    const { data: releases } = await supabase
      .from("release_notes")
      .select("slug, version")
      .eq("status", "published");

    if (!releases) return [];
    return releases.map((release) => ({
      slug: release.slug || release.version?.toLowerCase().replace(/[^a-z0-9-_]+/g, "-") || "undefined",
    }));
  } catch (err) {
    console.error("Error generating static params for changelog:", err);
    return [];
  }
}

export async function generateMetadata({ params }: ChangelogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const release = await getRelease(slug);

  if (!release) {
    return {
      title: "Release Not Found | ABRAM Docs",
    };
  }

  const releaseSlug = release.slug || release.version?.toLowerCase().replace(/[^a-z0-9-_]+/g, "-") || "undefined";
  const title = `v${release.version}: ${release.title} | ABRAM Changelog`;
  const description = release.summary || `Release notes for version ${release.version} of the ABRAM Network.`;
  const canonicalUrl = `https://abram.network/changelog/${releaseSlug}`;
  const keywords = ["ABRAM", "changelog", "release notes", `version ${release.version}`].concat(
    release.title.split(" ").filter((w: string) => w.length > 4)
  );

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalUrl,
      siteName: "ABRAM Docs",
      locale: "en_US",
      publishedTime: release.published_at || release.created_at,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ['/og-image.png'],
    },
  };
}

export default async function ChangelogDetailPage({ params }: ChangelogDetailPageProps) {
  const { slug } = await params;
  const release = await getRelease(slug);

  if (!release) {
    notFound();
  }

  // Fetch other releases (limit 3, exclude current)
  let otherReleases: any[] = [];
  try {
    const { data, error } = await supabase
      .from("release_notes")
      .select("id, slug, version, title, summary, published_at, created_at")
      .eq("status", "published")
      .neq("id", release.id)
      .order("published_at", { ascending: false })
      .limit(3);

    if (!error && data) {
      otherReleases = data;
    }
  } catch (err) {
    console.error("Error fetching other release notes:", err);
  }

  const formattedDate = new Date(release.published_at || release.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const releaseSlug = release.slug || release.version?.toLowerCase().replace(/[^a-z0-9-_]+/g, "-") || "undefined";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `https://abram.network/changelog/${releaseSlug}#techarticle`,
    "isPartOf": {
      "@type": "WebPage",
      "@id": `https://abram.network/changelog/${releaseSlug}`
    },
    "headline": `Version ${release.version}: ${release.title}`,
    "description": release.summary || `Release notes for version ${release.version} of the ABRAM Network.`,
    "image": "https://abram.network/og-image.png",
    "datePublished": release.published_at || release.created_at,
    "dateModified": release.published_at || release.created_at,
    "publisher": {
      "@type": "Organization",
      "@id": "https://abram.network/#organization"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://abram.network/changelog/${releaseSlug}`
    }
  };

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://abram.network"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Changelog",
        "item": "https://abram.network/changelog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `v${release.version} Release`,
        "item": `https://abram.network/changelog/${releaseSlug}`
      }
    ]
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto px-0 select-text">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Back to Changelog - Touch Target Optimized */}
      <div>
        <Link
          href="/changelog"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors group font-sans py-3 -my-3 min-h-[44px]"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform duration-200">←</span> Back to Changelog
        </Link>
      </div>

      <article className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-4 sm:p-8 md:p-10 select-text">
        <header className="space-y-4 mb-8 pb-8 border-b border-white/5">
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-medium font-sans">
            <span className="inline-flex items-center rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-white border border-white/10 font-mono">
              v{release.version}
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <time dateTime={release.published_at || release.created_at}>{formattedDate}</time>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 leading-tight font-sans">
            {release.title}
          </h1>
          {release.summary && (
            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal font-sans border-l-2 border-white/10 pl-4 py-1 mt-6">
              {release.summary}
            </p>
          )}
        </header>

        <div className="text-zinc-300 font-sans select-text release-notes-content">
          <MDXRemote source={release.content} components={mdxComponents} />
        </div>
      </article>

      {/* Recommendations Section */}
      {otherReleases && otherReleases.length > 0 && (
        <div className="mt-16 pt-10 border-t border-white/5 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-100 font-sans">
            Other Product Updates
          </h3>
          <div className={`grid grid-cols-1 gap-6 ${
            otherReleases.length === 2 ? "sm:grid-cols-2" : 
            otherReleases.length >= 3 ? "sm:grid-cols-2 md:grid-cols-3" : ""
          }`}>
            {otherReleases.map((otherRelease) => (
              <Link
                key={otherRelease.id}
                href={`/changelog/${otherRelease.slug || otherRelease.version?.toLowerCase().replace(/[^a-z0-9-_]+/g, "-") || "undefined"}`}
                className="group block rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-200 p-5 flex flex-col justify-between h-full"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase font-sans">
                    <span className="text-white bg-white/5 px-1 rounded font-mono">v{otherRelease.version}</span>
                    <time dateTime={otherRelease.published_at || otherRelease.created_at}>
                      {new Date(otherRelease.published_at || otherRelease.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <h4 className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors duration-200 leading-snug line-clamp-2 font-sans">
                    {otherRelease.title}
                  </h4>
                </div>
                <div className="text-xs font-semibold text-zinc-300 mt-6 group-hover:text-white transition-colors duration-200 flex items-center gap-1 pt-2 font-sans">
                  Read Updates <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
