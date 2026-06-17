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
    title: `${data.title || "Terms of Use"} | ABRAM Docs`,
    description: data.description || "Terms of Use for the ABRAM creative intelligence platform.",
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
    <div className="py-8 max-w-3xl mx-auto selection:bg-zinc-800 selection:text-white">
      <article className="max-w-none">
        <MDXRemote source={content} components={mdxComponents} />
      </article>
    </div>
  );
}
