import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "../../../components/MdxComponents";
import Breadcrumbs from "../../../components/Breadcrumbs";
import PrevNextNav from "../../../components/PrevNextNav";
import { getAllDocPages } from "../../../utils/navigation";
import { ensureContentCopied } from "../../../utils/navigation-server";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

function getDocContent(slug: string[]) {
  ensureContentCopied();

  const slugStr = slug.join("/");
  const contentDir = path.join(process.cwd(), "content");

  const possiblePaths = [
    path.join(contentDir, `${slugStr}.mdx`),
    path.join(contentDir, slugStr, "page.mdx"),
    path.join(contentDir, `${slugStr}.md`),
    path.join(contentDir, slugStr, "page.md"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const fileContent = fs.readFileSync(p, "utf8");
        const { data, content } = matter(fileContent);
        return { data, content };
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

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const doc = getDocContent(slug);

  if (!doc) {
    return {
      title: "Not Found | ABRAM Docs",
    };
  }

  const title = doc.data.title || "Documentation";
  const description = doc.data.description || "ABRAM Developer Documentation";

  return {
    title: `${title} | ABRAM Docs`,
    description,
  };
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = getDocContent(slug);

  if (!doc) {
    notFound();
  }

  const isCustomMode = doc.data.mode === "custom";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 lg:py-12">
      <Breadcrumbs slug={slug} />
      
      <article className="prose prose-zinc dark:prose-invert max-w-none">
        {!isCustomMode && (
          <>
            <h1 className="font-heading text-3xl font-bold uppercase tracking-wider mb-2 text-zinc-900 dark:text-zinc-50">
              {doc.data.title}
            </h1>
            {doc.data.description && (
              <p className="text-zinc-500 dark:text-zinc-400 text-base mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-6 leading-relaxed">
                {doc.data.description}
              </p>
            )}
          </>
        )}
        <MDXRemote source={doc.content} components={mdxComponents} />
      </article>

      <PrevNextNav slug={slug} />
    </div>
  );
}
