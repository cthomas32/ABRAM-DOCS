import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "../../components/MdxComponents";
import Breadcrumbs from "../../components/Breadcrumbs";
import PrevNextNav from "../../components/PrevNextNav";
import { ensureContentCopied } from "../../utils/navigation-server";

function getIndexContent() {
  ensureContentCopied();

  const contentDir = path.join(process.cwd(), "content");
  const indexPath = path.join(contentDir, "index.mdx");

  if (fs.existsSync(indexPath)) {
    try {
      const fileContent = fs.readFileSync(indexPath, "utf8");
      const { data, content } = matter(fileContent);
      return { data, content };
    } catch (err) {
      console.error("Error reading index.mdx:", err);
      return null;
    }
  }
  return null;
}

export async function generateMetadata() {
  const doc = getIndexContent();
  if (!doc) {
    return {
      title: "Docs | ABRAM",
    };
  }
  return {
    title: `${doc.data.title || "Home"} | ABRAM Docs`,
    description: doc.data.description || "ABRAM Developer Documentation",
  };
}

export default async function DocsIndexPage() {
  const doc = getIndexContent();

  if (!doc) {
    notFound();
  }

  const isCustomMode = doc.data.mode === "custom";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 lg:py-12">
      <Breadcrumbs slug={[]} />
      
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

      <PrevNextNav slug={[]} />
    </div>
  );
}
