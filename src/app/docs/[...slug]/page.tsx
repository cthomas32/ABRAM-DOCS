import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "../../../components/MdxComponents";
import { getAllDocPages } from "../../../utils/navigation";
import { ensureContentCopied } from "../../../utils/navigation-server";
import TableOfContents from "../../../components/TableOfContents";
import CopyPageDropdown from "../../../components/CopyPageDropdown";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

function getDocContent(slug: string[]) {
  ensureContentCopied();

  const slugStr = slug.join("/");

  // 1. Path traversal protection & validation against registered navigation paths
  const allPages = getAllDocPages();
  const navPage = allPages.find((p) => p.path === slugStr);
  if (!navPage || slug.some((segment) => segment.includes("..") || segment.includes("/"))) {
    return null;
  }

  const contentDir = process.cwd();
  const rootDir = slug[0];
  const remainingSlug = slug.slice(1).join("/");

  let possiblePaths: string[] = [];
  if (slugStr === "overview") {
    possiblePaths = [path.join(contentDir, "index.mdx")];
  } else if (rootDir === "user-guide") {
    const baseDir = path.join(contentDir, "user-guide");
    possiblePaths = [
      path.join(baseDir, `${remainingSlug}.mdx`),
      path.join(baseDir, remainingSlug, "page.mdx"),
      path.join(baseDir, `${remainingSlug}.md`),
      path.join(baseDir, remainingSlug, "page.md"),
    ];
  } else if (rootDir === "content") {
    const baseDir = path.join(contentDir, "content");
    possiblePaths = [
      path.join(baseDir, `${remainingSlug}.mdx`),
      path.join(baseDir, remainingSlug, "page.mdx"),
      path.join(baseDir, `${remainingSlug}.md`),
      path.join(baseDir, remainingSlug, "page.md"),
    ];
  }

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const fileContent = fs.readFileSync(p, "utf8");
        const { data, content } = matter(fileContent);

        // Fetch and format last modified time dynamically on the server
        const stats = fs.statSync(p);
        const lastUpdated = stats.mtime.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        return { data, content, lastUpdated };
      } catch (err) {
        console.error(`Error reading doc file at ${p}:`, err);
        return null;
      }
    }
  }

  return null;
}

export async function generateStaticParams() {
  const pages = getAllDocPages();
  // Filter out the empty slug page (index.mdx) since it will be handled by /docs/page.tsx
  return pages
    .filter((p) => p.slug.length > 0)
    .map((p) => ({
      slug: p.slug,
    }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocContent(slug);

  if (!doc) {
    return {
      title: "Not Found | ABRAM Docs",
    };
  }

  const slugStr = slug.join("/");
  const allPages = getAllDocPages();
  const navPage = allPages.find((p) => p.path === slugStr);

  // 1. Title extraction & fallbacks
  let title = doc.data.title || "";
  if (!title) {
    const match = doc.content.match(/^#\s+(.+)$/m);
    title = match ? match[1].trim() : (navPage?.title || "Documentation");
  }

  // 2. Description extraction & fallbacks
  let description = doc.data.description || "";
  if (!description) {
    const cleanContent = doc.content
      .replace(/#+\s+.+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/```[a-z]*\n[\s\S]*?\n```/g, "")
      .replace(/<[^>]*>/g, "")
      .replace(/[*_`~]/g, "")
      .trim();

    if (cleanContent) {
      const paragraphs = cleanContent.split("\n").map((p) => p.trim()).filter(Boolean);
      if (paragraphs.length > 0) {
        description = paragraphs[0];
        if (description.length > 160) {
          description = description.slice(0, 157) + "...";
        }
      }
    }
  }
  if (!description) {
    description = "ABRAM Developer Documentation and Help Center";
  }

  // 3. Keywords extraction & mapping (supports string, array, nested tags, and fallbacks)
  let rawKeywords =
    doc.data.keywords ||
    doc.data.tags ||
    doc.data.seo?.keywords ||
    doc.data.seo?.tags ||
    doc.data.aeo?.keywords ||
    doc.data.aeo?.tags;

  let keywordsList: string[] = [];
  if (rawKeywords) {
    if (Array.isArray(rawKeywords)) {
      keywordsList = rawKeywords.map((k: any) => String(k).trim());
    } else if (typeof rawKeywords === "string") {
      keywordsList = rawKeywords.split(",").map((k: string) => k.trim()).filter(Boolean);
    }
  }

  const baseKeywords = new Set<string>([
    "ABRAM",
    "ABRAM Network",
    "docs",
    "documentation",
    "help center",
    ...keywordsList,
  ]);

  if (navPage) {
    if (navPage.group) baseKeywords.add(navPage.group);
    if (navPage.product) baseKeywords.add(navPage.product);
  }

  const lowercaseContent = doc.content.toLowerCase();
  const lowercaseTitle = title.toLowerCase();

  const commonTerms = [
    "stripe", "milestone", "freelancer", "producer", "calendar", "slack",
    "intake", "ai", "brief", "security", "work package", "workflow", "payout",
    "invoice", "collaboration", "crew", "scheduling", "permissions", "onboarding"
  ];

  commonTerms.forEach((term) => {
    if (lowercaseContent.includes(term) || lowercaseTitle.includes(term)) {
      baseKeywords.add(term);
    }
  });

  const finalKeywords = Array.from(baseKeywords);

  // 4. Construct URL and extra variables
  const canonicalUrl = `https://docs.abram.network/docs/${slugStr}`;
  const category = doc.data.category || navPage?.group || "Documentation";
  const authorName = doc.data.author || "ABRAM Network";
  const publisherName = doc.data.publisher || "ABRAM Network";
  const robots = doc.data.robots || "index, follow";

  // Build custom AEO/SEO meta tags
  const customMetaTags: Record<string, string> = {};
  const knownAeoKeys = ["rating", "googlebot", "bingbot", "content-language", "aeo-entity-type"];
  knownAeoKeys.forEach((key) => {
    if (doc.data[key]) {
      customMetaTags[key] = String(doc.data[key]);
    }
  });

  if (doc.data.aeo && typeof doc.data.aeo === "object") {
    Object.entries(doc.data.aeo).forEach(([key, val]) => {
      customMetaTags[key] = String(val);
    });
  }
  if (doc.data.seo && typeof doc.data.seo === "object") {
    Object.entries(doc.data.seo).forEach(([key, val]) => {
      customMetaTags[key] = String(val);
    });
  }

  let publishedTime: string | undefined;
  if (doc.lastUpdated) {
    try {
      const parsedDate = new Date(doc.lastUpdated);
      if (!isNaN(parsedDate.getTime())) {
        publishedTime = parsedDate.toISOString();
      }
    } catch {
      // Ignore invalid date parsing
    }
  }

  return {
    title: `${title} | ABRAM Docs`,
    description,
    keywords: finalKeywords,
    category,
    authors: [{ name: authorName }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | ABRAM Docs`,
      description,
      type: "article",
      url: canonicalUrl,
      siteName: "ABRAM Docs",
      locale: "en_US",
      publishedTime,
      authors: [authorName],
      tags: finalKeywords,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ABRAM Docs`,
      description,
    },
    robots: {
      index: robots.includes('index'),
      follow: robots.includes('follow'),
    },
    other: {
      "content-language": "en",
      "aeo-entity-type": "Documentation",
      ...customMetaTags,
    },
  };
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = getDocContent(slug);

  if (!doc) {
    notFound();
  }

  const slugStr = slug.join("/");
  const allPages = getAllDocPages();
  const navPage = allPages.find((p) => p.path === slugStr);

  const isCustomMode = doc.data.mode === "custom";

  // 1. Resolve Title
  let title = doc.data.title || "";
  if (!title) {
    const match = doc.content.match(/^#\s+(.+)$/m);
    title = match ? match[1].trim() : (navPage?.title || "Documentation");
  }

  // 2. Resolve Description
  let description = doc.data.description || "";
  if (!description) {
    const cleanContent = doc.content
      .replace(/#+\s+.+/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/```[a-z]*\n[\s\S]*?\n```/g, "")
      .replace(/<[^>]*>/g, "")
      .replace(/[*_`~]/g, "")
      .trim();

    if (cleanContent) {
      const paragraphs = cleanContent.split("\n").map((p) => p.trim()).filter(Boolean);
      if (paragraphs.length > 0) {
        description = paragraphs[0];
        if (description.length > 160) {
          description = description.slice(0, 157) + "...";
        }
      }
    }
  }
  if (!description) {
    description = "ABRAM Developer Documentation and Help Center";
  }

  // 3. Resolve Keywords
  let rawKeywords =
    doc.data.keywords ||
    doc.data.tags ||
    doc.data.seo?.keywords ||
    doc.data.seo?.tags ||
    doc.data.aeo?.keywords ||
    doc.data.aeo?.tags;

  let keywordsList: string[] = [];
  if (rawKeywords) {
    if (Array.isArray(rawKeywords)) {
      keywordsList = rawKeywords.map((k: any) => String(k).trim());
    } else if (typeof rawKeywords === "string") {
      keywordsList = rawKeywords.split(",").map((k: string) => k.trim()).filter(Boolean);
    }
  }

  const baseKeywords = new Set<string>([
    "ABRAM",
    "ABRAM Network",
    "docs",
    "documentation",
    "help center",
    ...keywordsList,
  ]);

  if (navPage) {
    if (navPage.group) baseKeywords.add(navPage.group);
    if (navPage.product) baseKeywords.add(navPage.product);
  }

  const lowercaseContent = doc.content.toLowerCase();
  const lowercaseTitle = title.toLowerCase();

  const commonTerms = [
    "stripe", "milestone", "freelancer", "producer", "calendar", "slack",
    "intake", "ai", "brief", "security", "work package", "workflow", "payout",
    "invoice", "collaboration", "crew", "scheduling", "permissions", "onboarding"
  ];

  commonTerms.forEach((term) => {
    if (lowercaseContent.includes(term) || lowercaseTitle.includes(term)) {
      baseKeywords.add(term);
    }
  });

  const finalKeywords = Array.from(baseKeywords);

  // 4. Resolve dates
  let isoDate: string | undefined;
  if (doc.lastUpdated) {
    try {
      const parsedDate = new Date(doc.lastUpdated);
      if (!isNaN(parsedDate.getTime())) {
        isoDate = parsedDate.toISOString();
      }
    } catch {
      // Ignore invalid date parsing
    }
  }

  // 5. Generate JSON-LD Schema
  const canonicalUrl = `https://docs.abram.network/docs/${slugStr}`;
  const authorName = doc.data.author || "ABRAM Network";
  const publisherName = doc.data.publisher || "ABRAM Network";

  const articleSchema = {
    "@type": doc.data.schemaType || "TechArticle",
    "headline": title,
    "description": description,
    "keywords": finalKeywords.join(", "),
    "inLanguage": "en-US",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    "publisher": {
      "@type": "Organization",
      "name": publisherName,
      "logo": {
        "@type": "ImageObject",
        "url": "https://docs.abram.network/logo/dark.svg",
      },
    },
    "author": {
      "@type": doc.data.authorType || "Organization",
      "name": authorName,
    },
    ...(isoDate ? { "datePublished": isoDate, "dateModified": isoDate } : {}),
    ...(doc.data.schema && typeof doc.data.schema === "object" ? doc.data.schema : {}),
  };

  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://docs.abram.network",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Documentation",
        "item": "https://docs.abram.network/docs",
      },
      ...(navPage?.group ? [{
        "@type": "ListItem",
        "position": 3,
        "name": navPage.group,
      }] : []),
      {
        "@type": "ListItem",
        "position": navPage?.group ? 4 : 3,
        "name": title,
        "item": canonicalUrl,
      },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [articleSchema, breadcrumbSchema],
  };

  const hasInlineH1 = doc.content.trim().startsWith("# ");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="flex gap-10 xl:gap-14 items-start justify-center w-full">
        <div className="flex-1 min-w-0 max-w-3xl">
          <article className="max-w-none">
            {!isCustomMode && (
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
                <div className="space-y-1">
                  {!hasInlineH1 && (
                    <h1 className="font-sans text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 !mb-0">
                      {title}
                    </h1>
                  )}
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans !mt-1 !mb-0">
                    Last updated {doc.lastUpdated}
                  </p>
                </div>
                <div className="shrink-0 mt-1">
                  <CopyPageDropdown
                    title={title}
                    description={description}
                    rawMdx={doc.content}
                  />
                </div>
              </div>
            )}
            <MDXRemote source={doc.content} components={mdxComponents} />
          </article>
        </div>
        <TableOfContents />
      </div>
    </>
  );
}
