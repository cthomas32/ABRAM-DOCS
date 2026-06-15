import fs from "fs";
import path from "path";

export function ensureContentCopied() {
  const contentDir = path.join(process.cwd(), "content");

  // Create content directory if it doesn't exist
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
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
