import type { Metadata } from "next";
import { supabase } from "@/utils/supabase/static";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/MdxComponents";
import Link from "next/link";
import { cache } from "react";

export const revalidate = 60; // Revalidate page cache every 60 seconds (ISR)

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const getPost = cache(async (slug: string) => {
  try {
    const { data: post, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !post) {
      return null;
    }
    return post;
  } catch (err) {
    console.error("Error fetching blog post:", err);
    return null;
  }
});

export async function generateStaticParams() {
  try {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("status", "published");

    if (!posts) return [];
    return posts.map((post) => ({
      slug: post.slug,
    }));
  } catch (err) {
    console.error("Error generating static params for blog:", err);
    return [];
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: "Article Not Found | ABRAM Docs",
    };
  }

  const title = `${post.title} | ABRAM Blog`;
  const description = post.summary || post.title;
  const canonicalUrl = `https://abram.network/blog/${post.slug}`;
  const keywords = ["ABRAM", "blog", "article", post.author || "ABRAM Team"].concat(
    post.title.split(" ").filter((w: string) => w.length > 4)
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
      publishedTime: post.published_at || post.created_at,
      authors: [post.author || "ABRAM Network"],
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

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  // Fetch related articles (limit 3, exclude current)
  let otherPosts: any[] = [];
  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, slug, title, summary, author, published_at, created_at")
      .eq("status", "published")
      .neq("slug", slug)
      .order("published_at", { ascending: false })
      .limit(3);

    if (!error && data) {
      otherPosts = data;
    }
  } catch (err) {
    console.error("Error fetching other blog posts:", err);
  }

  const formattedDate = new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `https://abram.network/blog/${post.slug}#blogposting`,
    "isPartOf": {
      "@type": "WebPage",
      "@id": `https://abram.network/blog/${post.slug}`
    },
    "headline": post.title,
    "description": post.summary || post.title,
    "image": "https://abram.network/og-image.png",
    "datePublished": post.published_at || post.created_at,
    "dateModified": post.published_at || post.created_at,
    "author": {
      "@type": "Organization",
      "name": post.author || "ABRAM Network",
      "url": "https://abram.network"
    },
    "publisher": {
      "@type": "Organization",
      "@id": "https://abram.network/#organization"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://abram.network/blog/${post.slug}`
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
        "name": "Blog",
        "item": "https://abram.network/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": `https://abram.network/blog/${post.slug}`
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

      {/* Back to Blog - Touch Target Optimized */}
      <div>
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors group font-sans py-3 -my-3 min-h-[44px]"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform duration-200">←</span> Back to Blog
        </Link>
      </div>

      <article className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-4 sm:p-8 md:p-10 select-text">
        <header className="space-y-4 mb-8 pb-8 border-b border-white/5">
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-medium font-sans">
            <time dateTime={post.published_at || post.created_at}>{formattedDate}</time>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <div className="flex items-center gap-2">
              {post.author_avatar ? (
                <img
                  src={post.author_avatar}
                  alt={post.author}
                  className="w-5 h-5 rounded-full object-cover border border-white/10 shrink-0"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[9px] text-zinc-500 shrink-0">
                  {post.author?.charAt(0) || "A"}
                </div>
              )}
              <span>By {post.author || "ABRAM Team"}</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 leading-tight font-sans">
            {post.title}
          </h1>
          {post.summary && (
            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal font-sans border-l-2 border-white/10 pl-4 py-1 mt-6">
              {post.summary}
            </p>
          )}
        </header>

        <div className="text-zinc-300 font-sans select-text">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>
      </article>

      {/* Recommendations Section */}
      {otherPosts && otherPosts.length > 0 && (
        <div className="mt-16 pt-10 border-t border-white/5 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-100 font-sans">
            More from the ABRAM Journal
          </h3>
          <div className={`grid grid-cols-1 gap-6 ${
            otherPosts.length === 2 ? "sm:grid-cols-2" : 
            otherPosts.length >= 3 ? "sm:grid-cols-2 md:grid-cols-3" : ""
          }`}>
            {otherPosts.map((otherPost) => (
              <Link
                key={otherPost.id}
                href={`/blog/${otherPost.slug}`}
                className="group block rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md hover:border-white/10 hover:bg-zinc-900/30 transition-all duration-200 p-5 flex flex-col justify-between h-full"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase font-sans">
                    <time dateTime={otherPost.published_at || otherPost.created_at}>
                      {new Date(otherPost.published_at || otherPost.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <h4 className="text-base font-semibold text-zinc-100 group-hover:text-white transition-colors duration-200 leading-snug line-clamp-2 font-sans">
                    {otherPost.title}
                  </h4>
                </div>
                <div className="text-xs font-semibold text-zinc-300 mt-6 group-hover:text-white transition-colors duration-200 flex items-center gap-1 pt-2 font-sans">
                  Read Article <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
