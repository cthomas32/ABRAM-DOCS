"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Cover } from "../mdx/Cover";
import { AuthorAvatar } from "./AuthorAvatar";

interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  author: string;
  author_avatar?: string | null;
  published_at: string | null;
  created_at: string;
  content?: string;
}

function parseCoverRows(content?: string) {
  if (!content) return null;
  const match = content.match(/<Cover\s+rows=\{([\s\S]*?)\}\s*\/?>/);
  if (!match) return null;
  try {
    const rowsRaw = match[1];
    const jsonCorrected = rowsRaw
      .replace(/'/g, '"')
      .replace(/([{\s,])(\w+)(:)/g, '$1"$2"$3');
    return JSON.parse(jsonCorrected);
  } catch (e) {
    console.error("Failed to parse Cover rows:", e);
    return null;
  }
}

function extractSvg(content?: string) {
  if (!content) return null;
  const match = content.match(/<svg[\s\S]*?<\/svg>/i);
  return match ? match[0] : null;
}

interface BlogListClientProps {
  posts: Post[];
}

const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

export default function BlogListClient({ posts }: BlogListClientProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-zinc-950/10 p-12 text-center text-zinc-500">
        <p className="text-sm font-sans">No articles published yet. Check back soon!</p>
      </div>
    );
  }

  const featuredPost = posts[0];
  const gridPosts = posts.slice(1);
  const coverRows = parseCoverRows(featuredPost.content);
  const coverSvg = extractSvg(featuredPost.content);

  const formatPostDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-12">
      {/* Featured Post Card */}
      {featuredPost && (
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <Link href={`/blog/${featuredPost.slug}`} className="group block">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950/40 via-zinc-950/20 to-red-500/[0.01] backdrop-blur-md p-5 sm:p-8 flex flex-col md:flex-row gap-6 md:gap-8 hover:bg-zinc-900/40 hover:border-white/15 transition-all duration-300"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-red-500/[0.02] rounded-full blur-[100px] pointer-events-none" />

              {/* Graphic/Brand Visual Section */}
              <div className="w-full md:w-1/2 aspect-[16/10] rounded-xl border border-white/5 bg-zinc-950/80 relative overflow-hidden flex items-center justify-center select-none">
                {coverRows ? (
                  <div className="absolute inset-0 p-4 flex items-center justify-center overflow-hidden scale-[0.8] sm:scale-[0.85] md:scale-[0.9]">
                    <Cover rows={coverRows} noMargin />
                  </div>
                ) : coverSvg ? (
                  <div 
                    className="absolute inset-0 p-4 flex items-center justify-center overflow-hidden scale-[0.8] sm:scale-[0.85] md:scale-[0.9] [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full"
                    dangerouslySetInnerHTML={{ __html: coverSvg }}
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 tech-grid-overlay opacity-[0.12] pointer-events-none" />
                    <div className="absolute w-40 h-40 rounded-full bg-red-500/[0.08] blur-[50px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    <span className="text-zinc-600 text-[10px] tracking-[0.2em] uppercase font-sans font-semibold">
                      ABRAM JOURNAL
                    </span>
                  </>
                )}
              </div>

              {/* Content Section */}
              <div className="w-full md:w-1/2 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase font-sans">
                    <span className="text-zinc-400">Featured</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <time dateTime={featuredPost.published_at || featuredPost.created_at}>
                      {formatPostDate(featuredPost.published_at || featuredPost.created_at)}
                    </time>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl font-semibold text-zinc-50 group-hover:text-white transition-colors duration-300 leading-snug font-sans">
                    {featuredPost.title}
                  </h2>

                  {/* Summary */}
                  {featuredPost.summary && (
                    <p className="text-sm text-zinc-400 leading-relaxed font-sans line-clamp-3">
                      {featuredPost.summary}
                    </p>
                  )}
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <AuthorAvatar src={featuredPost.author_avatar} name={featuredPost.author} size="sm" />
                    <span className="text-xs text-zinc-500 font-medium font-sans">
                      By {featuredPost.author}
                    </span>
                  </div>
                  <div className="btn-glass px-4 py-1.5 text-xs">
                    Read Article
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200 ml-1">→</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      )}

      {/* Grid of Remaining Posts */}
      {gridPosts.length > 0 && (
        <motion.div
          variants={listContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {gridPosts.map((post) => (
            <motion.div key={post.id} variants={listItem}>
              <Link href={`/blog/${post.slug}`} className="group block h-full">
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] }}
                  className="flex flex-col justify-between h-full rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-5 sm:p-6 hover:bg-zinc-900/30 hover:border-white/10 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 font-medium font-sans">
                      <time dateTime={post.published_at || post.created_at}>
                        {formatPostDate(post.published_at || post.created_at)}
                      </time>
                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                      <div className="flex items-center gap-1.5">
                        <AuthorAvatar
                          src={post.author_avatar}
                          name={post.author}
                          className="w-4 h-4 text-[8px]"
                        />
                        <span>By {post.author}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-white transition-colors duration-200 leading-snug line-clamp-2 font-sans">
                      {post.title}
                    </h3>

                    {/* Description */}
                    {post.summary && (
                      <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3 font-sans">
                        {post.summary}
                      </p>
                    )}
                  </div>

                  {/* Read action */}
                  <div className="text-xs font-semibold text-zinc-300 mt-6 group-hover:text-white transition-colors duration-200 flex items-center gap-1 pt-4 border-t border-white/5 font-sans">
                    Read Article
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
