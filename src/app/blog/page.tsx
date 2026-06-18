import type { Metadata } from "next";
import React from "react";
import { supabase } from "@/utils/supabase/static";
import BlogListClient from "@/components/blog/BlogListClient";

export const revalidate = 60; // Revalidate page cache every 60 seconds (ISR)

export const metadata: Metadata = {
  title: "Blog",
  description: "The latest announcements, updates, and articles from the ABRAM Network team.",
  keywords: ["ABRAM", "blog", "updates", "announcements", "crewing", "production management"],
  alternates: {
    canonical: "https://abram.network/blog",
  },
  openGraph: {
    title: "Blog | ABRAM Docs",
    description: "The latest announcements, updates, and articles from the ABRAM Network team.",
    type: "website",
    url: "https://abram.network/blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | ABRAM Docs",
    description: "The latest announcements, updates, and articles from the ABRAM Network team.",
  },
};

export default async function BlogListingPage() {
  let posts: any[] = [];
  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, slug, title, summary, author, published_at, created_at, content")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error loading blog posts:", error.message);
    } else if (data) {
      posts = data;
    }
  } catch (err) {
    console.error("Error fetching blog posts from Supabase:", err);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://abram.network/blog#collectionpage",
    "url": "https://abram.network/blog",
    "name": "ABRAM Network Blog",
    "description": "The latest announcements, updates, and articles from the ABRAM Network team.",
    "isPartOf": {
      "@type": "WebSite",
      "@id": "https://abram.network/#website"
    },
    "publisher": {
      "@type": "Organization",
      "@id": "https://abram.network/#organization"
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": posts.length,
      "itemListElement": posts.map((post: any, index: number) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://abram.network/blog/${post.slug}`,
        "name": post.title,
      }))
    }
  };

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div>
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 font-sans">
          NETWORK UPDATES
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 font-sans mt-1">
          Blog
        </h1>
        <p className="text-base font-normal leading-7 text-zinc-400 mt-2 font-sans">
          The latest announcements, updates, and articles from the ABRAM Network team.
        </p>
      </div>

      <BlogListClient posts={posts} />
    </div>
  );
}
