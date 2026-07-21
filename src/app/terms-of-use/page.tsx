import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "../../components/MdxComponents";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const filePath = path.join(process.cwd(), "user-guide", "ABRAM_Terms_of_Use.md");
  if (!fs.existsSync(filePath)) {
    return { title: "Terms of Use" };
  }
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data } = matter(fileContent);
  return {
    title: data.title || "Terms of Use",
    description: data.description || "Terms of Use for the ABRAM creative intelligence platform.",
    keywords: ["ABRAM", "terms of use", "service terms", "legal agreement"],
    alternates: {
      canonical: 'https://abram.network/terms-of-use',
    },
  };
}

export default function TermsOfUsePage() {
  const filePath = path.join(process.cwd(), "user-guide", "ABRAM_Terms_of_Use.md");
  if (!fs.existsSync(filePath)) {
    return (
      <div className="py-8 text-center text-zinc-500">
        Terms of Use document not found.
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
                '@id': 'https://abram.network/terms-of-use/#webpage',
                'url': 'https://abram.network/terms-of-use',
                'name': 'Terms of Use | ABRAM Network',
                'description': 'Terms of Use for the ABRAM platform.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/terms-of-use/#breadcrumb',
                'itemListElement': [
                  { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://abram.network/' },
                  { '@type': 'ListItem', 'position': 2, 'name': 'Terms of Use', 'item': 'https://abram.network/terms-of-use' },
                ],
              },
            ],
          }).replace(/</g, '\\u003c'),
        }}
      />
      <div className="py-8 max-w-3xl mx-auto selection:bg-zinc-800 selection:text-white">
        <article className="max-w-none">
          <MDXRemote source={content} components={mdxComponents} />
        </article>
      </div>
    </>
  );
}
