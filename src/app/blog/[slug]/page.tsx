import type { Metadata } from "next";
import { supabase } from "@/utils/supabase/static";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/MdxComponents";
import Link from "next/link";

export const revalidate = 60; // Revalidate page cache every 60 seconds (ISR)

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPost(slug: string) {
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
}

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

  return {
    title,
    description,
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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors group font-sans"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform duration-200">←</span> Back to Blog
      </Link>

      <article className="rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-md p-6 sm:p-8 md:p-10 select-text">
        <header className="space-y-4 mb-8 pb-8 border-b border-white/5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500 font-medium">
            <time dateTime={post.published_at || post.created_at}>{formattedDate}</time>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>By {post.author || "ABRAM Team"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 leading-tight font-sans">
            {post.title}
          </h1>
          {post.summary && (
            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal font-sans">
              {post.summary}
            </p>
          )}
        </header>

        <div className="text-zinc-300 font-sans select-text">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>
      </article>
    </div>
  );
}
