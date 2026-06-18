"use server";

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { exec } from "child_process";
import { promisify } from "util";
import { createClient } from "@/utils/supabase/server";

const execAsync = promisify(exec);
const PROJECT_ROOT = path.resolve(process.cwd());

/**
 * Rebuilds the Flexsearch index by running the pre-build search index script.
 */
export async function rebuildSearchIndex() {
  try {
    const { stdout, stderr } = await execAsync("node scripts/build-search-index.js");
    console.log("Rebuilt search index:", stdout);
    if (stderr) console.error("Search index build stderr:", stderr);
    return { success: true, message: stdout };
  } catch (error: any) {
    console.error("Failed to rebuild search index:", error);
    return { success: false, error: error?.message || "Build script failure." };
  }
}

/**
 * Reads all editable markdown articles in the workspace.
 */
export async function getArticlesList() {
  try {
    const supabase = await createClient();
    const { data: docs, error } = await supabase
      .from("help_docs")
      .select("slug, title, sidebar_title, content")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const articles: Array<{ path: string; title: string; status: string; type: "blog" | "docs" }> = [];

    for (const doc of docs || []) {
      const relativePath = doc.slug === "overview" ? "index.mdx" : `${doc.slug}.md`;
      
      let status = "published";
      let title = doc.title || doc.sidebar_title || "";
      
      if (doc.content) {
        try {
          const { data } = matter(doc.content);
          if (data.status) status = data.status;
          if (data.title) title = data.title;
        } catch (e) {
          // ignore parsing error
        }
      }

      articles.push({
        path: relativePath,
        title: title || doc.slug,
        status: status,
        type: "docs"
      });
    }

    // Ensure overview (index.mdx) is at the top of the list if it exists
    const overviewIndex = articles.findIndex((a) => a.path === "index.mdx");
    if (overviewIndex > -1) {
      const [overview] = articles.splice(overviewIndex, 1);
      articles.unshift(overview);
    }

    return { success: true, articles };
  } catch (error: any) {
    console.error("Failed to list articles:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Loads the detailed content and frontmatter of a specific article.
 */
export async function readArticleContent(relativePath: string) {
  try {
    const slug = relativePath === "index.mdx" || relativePath === "index.md" || relativePath === "overview"
      ? "overview"
      : relativePath.replace(/\.(md|mdx)$/, "");

    const supabase = await createClient();
    const { data: doc, error } = await supabase
      .from("help_docs")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!doc) {
      return { success: false, error: "Article not found." };
    }

    let frontmatterData: any = {};
    let parsedContent = doc.content || "";

    if (doc.content) {
      try {
        const { data, content } = matter(doc.content);
        frontmatterData = data;
        parsedContent = content;
      } catch (e) {
        // Fallback to columns
      }
    }

    const title = frontmatterData.title || doc.title || "";
    const sidebarTitle = frontmatterData.sidebarTitle || doc.sidebar_title || "";
    const description = frontmatterData.description || doc.description || "";
    const keywords = frontmatterData.keywords || doc.keywords || [];
    const status = frontmatterData.status || "published";
    const publishDate = frontmatterData.publishDate || "";

    return {
      success: true,
      frontmatter: {
        title,
        sidebarTitle,
        description,
        keywords: Array.isArray(keywords) ? keywords.join(", ") : keywords,
        status,
        publishDate
      },
      content: parsedContent
    };
  } catch (error: any) {
    console.error(`Failed to read article ${relativePath}:`, error);
    return { success: false, error: error.message };
  }
}

interface SaveArticleInput {
  title: string;
  sidebarTitle?: string;
  description?: string;
  keywords?: string;
  status: "draft" | "published";
  publishDate?: string;
}

/**
 * Saves content and compiles frontmatter for an article, then regenerates the search index.
 */
export async function saveArticleContent(
  relativePath: string,
  frontmatter: SaveArticleInput,
  content: string
) {
  try {
    const slug = relativePath === "index.mdx" || relativePath === "index.md" || relativePath === "overview"
      ? "overview"
      : relativePath.replace(/\.(md|mdx)$/, "");

    // 1. Process keywords string to clean array
    const keywordsArray = frontmatter.keywords
      ? frontmatter.keywords
          .split(",")
          .map((kw) => kw.trim())
          .filter((kw) => kw.length > 0)
      : [];

    // 2. Build frontmatter block
    const dataToDump: Record<string, any> = {
      title: frontmatter.title,
    };

    if (frontmatter.sidebarTitle) dataToDump.sidebarTitle = frontmatter.sidebarTitle;
    if (frontmatter.description) dataToDump.description = frontmatter.description;
    if (keywordsArray.length > 0) dataToDump.keywords = keywordsArray;
    dataToDump.status = frontmatter.status;
    if (frontmatter.publishDate) dataToDump.publishDate = frontmatter.publishDate;

    // 3. Compile markdown file content
    const compiledContent = matter.stringify(content, dataToDump);

    // 4. Save to database
    const supabase = await createClient();
    const { error } = await supabase
      .from("help_docs")
      .upsert({
        slug,
        title: frontmatter.title,
        sidebar_title: frontmatter.sidebarTitle || null,
        description: frontmatter.description || null,
        keywords: keywordsArray,
        content: compiledContent,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "slug"
      });

    if (error) throw error;

    // 5. Trigger search index rebuild
    const rebuildResult = await rebuildSearchIndex();

    return {
      success: true,
      message: "Article saved to database and search index rebuilt successfully.",
      indexRebuilt: rebuildResult.success
    };
  } catch (error: any) {
    console.error(`Failed to save article ${relativePath}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Creates a brand new document file in the user-guide directory and registers it in docs.json.
 */
export async function createNewArticle(fileName: string, title: string) {
  try {
    // Standardize file naming structure: e.g. "1.6-my-new-article.md"
    let cleanFileName = fileName.trim();
    if (!cleanFileName.endsWith(".md") && !cleanFileName.endsWith(".mdx")) {
      cleanFileName += ".md";
    }

    const relativePath = path.join("user-guide", cleanFileName);
    const slug = relativePath.replace(/\.(md|mdx)$/, "");

    const supabase = await createClient();

    // Check if already exists
    const { data: existingDoc, error: checkError } = await supabase
      .from("help_docs")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingDoc) {
      return { success: false, error: "An article with this slug already exists." };
    }

    // Default frontmatter template
    const initialFrontmatter = {
      title: title,
      sidebarTitle: title.replace(/^\d+(\.\d+)*-/, "").trim(),
      description: "Brief summary describing the new article.",
      keywords: ["ABRAM"],
      status: "draft"
    };

    const initialContent = matter.stringify("\n# " + title + "\n\nWrite your content here...", initialFrontmatter);

    // Save to database
    const { error: insertError } = await supabase
      .from("help_docs")
      .insert({
        slug,
        title,
        sidebar_title: initialFrontmatter.sidebarTitle,
        description: initialFrontmatter.description,
        keywords: initialFrontmatter.keywords,
        content: initialContent
      });

    if (insertError) throw insertError;

    // Register in docs.json under the "Setup & Team" group
    const docsJsonPath = path.join(PROJECT_ROOT, "docs.json");
    if (fs.existsSync(docsJsonPath)) {
      const docsJson = JSON.parse(fs.readFileSync(docsJsonPath, "utf-8"));
      if (docsJson.navigation && docsJson.navigation.products) {
        const primaryProduct = docsJson.navigation.products[0];
        if (primaryProduct && primaryProduct.groups) {
          const setupGroup = primaryProduct.groups.find(
            (g: any) => g.group === "Setup & Team" || g.group === "Introduction & Concepts"
          ) || primaryProduct.groups[0];

          if (setupGroup && Array.isArray(setupGroup.pages)) {
            const pagePathWithoutExt = relativePath.replace(/\.(md|mdx)$/, "");
            if (!setupGroup.pages.includes(pagePathWithoutExt)) {
              setupGroup.pages.push(pagePathWithoutExt);
              fs.writeFileSync(docsJsonPath, JSON.stringify(docsJson, null, 2), "utf-8");
            }
          }
        }
      }
    }

    // Rebuild index
    await rebuildSearchIndex();

    return { success: true, relativePath };
  } catch (error: any) {
    console.error("Failed to create new article:", error);
    return { success: false, error: error.message };
  }
}
