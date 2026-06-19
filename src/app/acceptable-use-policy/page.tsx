import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "../../components/MdxComponents";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const filePath = path.join(process.cwd(), "user-guide", "ABRAM_Acceptable_Use_Policy.md");
  if (!fs.existsSync(filePath)) {
    return { title: "Acceptable Use Policy" };
  }
  const fileContent = fs.readFileSync(filePath, "utf8");
  const { data } = matter(fileContent);
  return {
    title: `${data.title || "Acceptable Use Policy"} | ABRAM Docs`,
    description: data.description || "Acceptable Use Policy for the ABRAM creative intelligence platform.",
  };
}

export default function AcceptableUsePolicyPage() {
  const filePath = path.join(process.cwd(), "user-guide", "ABRAM_Acceptable_Use_Policy.md");
  if (!fs.existsSync(filePath)) {
    return (
      <div className="py-8 text-center text-zinc-500">
        Acceptable Use Policy document not found.
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
