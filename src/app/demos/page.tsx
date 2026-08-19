import type { Metadata } from "next";
import DemoLibrary from "./DemoLibrary";
import { getDemoLibrary, streamUrl, thumbnailUrl } from "@/lib/demos";

/* Publishing a demo in the console should put it on the site without a
   deploy, so the page revalidates on the same cadence as the changelog. */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Demos | ABRAM",
  description:
    "Short product demos of ABRAM — script breakdown, call sheets, scheduling, crew payouts, and the client portal, shown end to end.",
  keywords: [
    "ABRAM demo",
    "ABRAM walkthrough",
    "creative production software demo",
    "film production software walkthrough",
    "call sheet software demo",
    "creative operations platform demo",
  ],
  alternates: {
    canonical: "https://abram.network/demos",
  },
  openGraph: {
    title: "Demos | ABRAM",
    description: "Short product demos of ABRAM, shown end to end.",
    url: "https://abram.network/demos",
    siteName: "ABRAM Network",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Demos | ABRAM",
    description: "Short product demos of ABRAM, shown end to end.",
  },
};

export default async function DemosPage() {
  const folders = await getDemoLibrary();
  const videos = folders.flatMap((folder) => folder.videos);

  /* One VideoObject per demo, wrapped in the collection page. This is
     what puts a video thumbnail beside the result in search, and it is
     the only reason the rows carry duration and publish date. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://abram.network/demos#webpage",
        url: "https://abram.network/demos",
        name: "ABRAM Demos",
        description: "Short product demos of ABRAM, shown end to end.",
        isPartOf: { "@id": "https://abram.network/#website" },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://abram.network/demos#breadcrumb",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://abram.network/" },
          { "@type": "ListItem", position: 2, name: "Demos", item: "https://abram.network/demos" },
        ],
      },
      ...videos.map((video, index) => ({
        "@type": "VideoObject",
        "@id": `https://abram.network/demos?v=${video.slug}#video`,
        position: index + 1,
        name: video.title,
        description: video.description ?? undefined,
        thumbnailUrl: [thumbnailUrl(video, { width: 1280, height: 720 })],
        contentUrl: streamUrl(video),
        url: `https://abram.network/demos?v=${video.slug}`,
        uploadDate: video.publishedAt ?? undefined,
        duration: video.duration ? `PT${Math.round(video.duration)}S` : undefined,
        isPartOf: { "@id": "https://abram.network/demos#webpage" },
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <header className="mb-12 max-w-2xl sm:mb-14">
          <span className="mb-3 inline-block font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Demos
          </span>
          <h1 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
            See ABRAM work.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base sm:leading-7">
            Short walkthroughs of the platform, recorded end to end. No sign up, no sales call.
          </p>
        </header>

        <DemoLibrary folders={folders} />
      </div>
    </>
  );
}
