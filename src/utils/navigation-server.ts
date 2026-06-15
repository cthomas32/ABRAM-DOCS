import fs from "fs";
import path from "path";

export function ensureContentCopied() {
  const contentDir = path.join(process.cwd(), "content");
  const backupDir = path.join(process.cwd(), "_mintlify_backup");

  // Create content directory if it doesn't exist
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
  }

  // Copy backup files if they exist and content is empty
  if (fs.existsSync(backupDir) && fs.readdirSync(contentDir).length === 0) {
    console.log("Populating content/ folder from _mintlify_backup...");
    copyDirSync(backupDir, contentDir);
  }

  // Generate missing files from search-index.json
  const searchIndexPath = path.join(process.cwd(), "public", "search-index.json");
  if (fs.existsSync(searchIndexPath)) {
    try {
      const indexContent = fs.readFileSync(searchIndexPath, "utf8");
      const indexPages = JSON.parse(indexContent);
      
      for (const page of indexPages) {
        const slug = page.slug; // e.g. "introduction" or "clients/quickstart"
        const filePath = path.join(contentDir, `${slug}.mdx`);
        
        // Ensure the directory exists
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // If the file doesn't exist, create it with frontmatter
        if (!fs.existsSync(filePath)) {
          const frontmatter = `---
title: "${page.title.replace(/"/g, '\\"')}"
description: "${page.description ? page.description.replace(/"/g, '\\"') : ""}"
---

${page.content}
`;
          fs.writeFileSync(filePath, frontmatter, "utf8");
          console.log(`Generated ${filePath} from search index`);
        }
      }
    } catch (e) {
      console.error("Error generating files from search index:", e);
    }
  }
}

function copyDirSync(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.name === "docs.json" || entry.name === "logo") continue;
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function getNavigationConfig() {
  const docsJsonPath = path.join(process.cwd(), "docs.json");
  if (!fs.existsSync(docsJsonPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(docsJsonPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading docs.json:", error);
    return null;
  }
}
