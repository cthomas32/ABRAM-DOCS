import type { Metadata } from "next";
import { supabase } from "@/utils/supabase/static";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/MdxComponents";

export const revalidate = 60; // Revalidate page cache every 60 seconds (ISR)

export const metadata: Metadata = {
  title: "Changelog | ABRAM Docs",
  description: "Updates, improvements, and new features added to the ABRAM Network.",
  alternates: {
    canonical: "https://abram.network/changelog",
  },
  openGraph: {
    title: "Changelog | ABRAM Docs",
    description: "Updates, improvements, and new features added to the ABRAM Network.",
    url: "https://abram.network/changelog",
    siteName: "ABRAM Docs",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog | ABRAM Docs",
    description: "Updates, improvements, and new features added to the ABRAM Network.",
  },
};

export default async function ChangelogPage() {
  let releases = [];
  try {
    const { data, error } = await supabase
      .from("release_notes")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error loading release notes:", error.message);
    } else if (data) {
      releases = data;
    }
  } catch (err) {
    console.error("Error fetching release notes from Supabase:", err);
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 font-sans">
          Changelog
        </h1>
        <p className="text-base font-normal leading-7 text-zinc-400 mt-2 font-sans">
          Updates, improvements, and new features added to the ABRAM Network.
        </p>
      </div>

      {releases && releases.length > 0 ? (
        <div className="relative border-l border-white/10 space-y-8 py-2 ml-4">
          {releases.map((release, index) => {
            const isLatest = index === 0;
            const formattedDate = new Date(release.published_at || release.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            return (
              <div key={release.id} className="relative pl-6 sm:pl-8 group">
                {/* Timeline Dot */}
                <div
                  className={`absolute left-0 top-8 h-2.5 w-2.5 -translate-x-1/2 rounded-full border transition-all duration-200 ring-4 ring-[#0A0A0A] ${
                    isLatest
                      ? "bg-zinc-50 border-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      : "bg-zinc-950 border-white/20 group-hover:border-zinc-400 group-hover:bg-zinc-100"
                  }`}
                />

                {/* Card Panel */}
                <div className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6 sm:p-8 hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-200">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="inline-flex items-center rounded bg-white/10 px-2 py-0.5 text-xs font-bold text-white border border-white/10">
                      v{release.version}
                    </span>
                    <time
                      className="text-xs text-zinc-500 font-medium"
                      dateTime={release.published_at || release.created_at}
                    >
                      {formattedDate}
                    </time>
                  </div>

                  <h2 className="text-xl font-semibold text-zinc-50 mb-4 font-sans">
                    {release.title}
                  </h2>

                  <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-300 font-sans select-text">
                    <MDXRemote source={release.content} components={mdxComponents} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-zinc-950/10 p-12 text-center text-zinc-500">
          <p className="text-sm">No release notes published yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
