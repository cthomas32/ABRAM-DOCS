import React from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase/static";

export const revalidate = 60; // Revalidate page cache every 60 seconds (ISR)

export default async function BlogListingPage() {
  let posts = [];
  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
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

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50 font-sans">
          Blog
        </h1>
        <p className="text-base font-normal leading-7 text-zinc-400 mt-2 font-sans">
          The latest announcements, updates, and articles from the ABRAM Network team.
        </p>
      </div>

      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-200 p-6 flex flex-col justify-between h-full"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-zinc-500 font-medium font-sans">
                  <span>
                    {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <span>By {post.author}</span>
                </div>
                <h2 className="text-xl font-semibold text-zinc-100 group-hover:text-white transition-colors duration-200 leading-snug line-clamp-2 font-sans">
                  {post.title}
                </h2>
                {post.summary && (
                  <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 font-sans">
                    {post.summary}
                  </p>
                )}
              </div>
              <div className="text-xs font-semibold text-zinc-300 mt-6 group-hover:text-white transition-colors duration-200 flex items-center gap-1 pt-2 font-sans">
                Read Article <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/5 bg-zinc-950/10 p-12 text-center text-zinc-500">
          <p className="text-sm font-sans">No articles published yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
