import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "../../components/MdxComponents";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const filePath = path.join(process.cwd(), "user-guide", "ABRAM_Privacy_Policy.md");
  if (!fs.existsSync(filePath)) {
    return { title: "Privacy Policy" };
  }
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data } = matter(fileContent);
  return {
    title: data.title || "Privacy Policy",
    description: data.description || "Privacy Policy for the ABRAM creative intelligence platform.",
    keywords: ["ABRAM", "privacy policy", "data protection", "gdpr", "privacy"],
    alternates: {
      canonical: 'https://abram.network/privacy-policy',
    },
    openGraph: {
      title: data.title || "Privacy Policy | ABRAM Network",
      description: data.description || "Privacy Policy for the ABRAM creative intelligence platform.",
      type: 'website',
      url: 'https://abram.network/privacy-policy',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title || "Privacy Policy | ABRAM Network",
      description: data.description || "Privacy Policy for the ABRAM creative intelligence platform.",
    },
  };
}

export default function PrivacyPolicyPage() {
  const filePath = path.join(process.cwd(), "user-guide", "ABRAM_Privacy_Policy.md");
  if (!fs.existsSync(filePath)) {
    return (
      <div className="py-8 text-center text-zinc-500">
        Privacy Policy document not found.
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
                '@id': 'https://abram.network/privacy-policy/#webpage',
                'url': 'https://abram.network/privacy-policy',
                'name': 'Privacy Policy | ABRAM Network',
                'description': 'Privacy Policy for the ABRAM platform.',
                'isPartOf': { '@id': 'https://abram.network/#website' },
              },
              {
                '@type': 'BreadcrumbList',
                '@id': 'https://abram.network/privacy-policy/#breadcrumb',
                'itemListElement': [
                  { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://abram.network/' },
                  { '@type': 'ListItem', 'position': 2, 'name': 'Privacy Policy', 'item': 'https://abram.network/privacy-policy' },
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
