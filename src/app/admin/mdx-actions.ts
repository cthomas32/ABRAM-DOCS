"use server";

import { serialize } from "next-mdx-remote/serialize";

export interface CompileMdxResponse {
  success: boolean;
  mdxSource?: any;
  error?: string;
}

/**
 * Server Action: Compiles MDX/Markdown content into a serialized structure.
 * This runs on the server to support full MDX compilation (such as custom components,
 * tables, lists, etc.) and returns the result to the client.
 */
export async function compileMdxAction(content: string): Promise<CompileMdxResponse> {
  try {
    const mdxSource = await serialize(content);
    return { success: true, mdxSource };
  } catch (err: any) {
    console.error("MDX Compilation Error:", err);
    return { success: false, error: err.message || "Failed to compile MDX content." };
  }
}
