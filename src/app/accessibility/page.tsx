import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "../../components/MdxComponents";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const filePath = path.join(process.cwd(), "user-guide", "ABRAM_Accessibility_Statement.md");
  if (!fs.existsSync(filePath)) {
    return { title: "Accessibility Statement | ABRAM" };
  }
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data } = matter(fileContent);
  return {
    title: "Accessibility Statement | ABRAM",
    description:
      data.description ||
      "How ABRAM approaches accessibility, the standard we aim for, known limitations, and how to report an accessibility barrier.",
    keywords: ["ABRAM", "accessibility", "accessibility statement", "WCAG 2.1 AA", "a11y"],
    alternates: {
      canonical: 'https://abram.network/accessibility',
    },
    openGraph: {
      title: data.title || "Accessibility Statement | ABRAM Network",
      description: data.description || "Accessibility Statement for the ABRAM creative intelligence platform.",
      type: 'website',
      url: 'https://abram.network/accessibility',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title || "Accessibility Statement | ABRAM Network",
      description: data.description || "Accessibility Statement for the ABRAM creative intelligence platform.",
    },
  };
}

export default function AccessibilityPage() {
  const filePath = path.join(process.cwd(), "user-guide", "ABRAM_Accessibility_Statement.md");
  if (!fs.existsSync(filePath)) {
    return (
      <div className="py-8 text-center text-zinc-500">
        Accessibility Statement document not found.
      </div>
    );
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  const { content } = matter(fileContent);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebPage',
                '@id': 'https://abram.network/accessibility/#webpage',
                'url': 'https://abram.network/accessibility',
                'name': 'Accessibility Statement | ABRAM Network',
                'description': 'Accessibility Statement for the ABRAM platform.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/accessibility/#breadcrumb',
                'itemListElement': [
                  { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://abram.network/' },
                  { '@type': 'ListItem', 'position': 2, 'name': 'Accessibility Statement', 'item': 'https://abram.network/accessibility' },
                ],
              },
            ],
          }).replace(/</g, '\\u003c'),
        }}
      />
      <div className="py-8 max-w-3xl mx-auto selection:bg-zinc-800 selection:text-white">
        <article className="max-w-none">
          <MDXRemote
            source={content}
            components={mdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </article>
      </div>
    </>
  );
}
