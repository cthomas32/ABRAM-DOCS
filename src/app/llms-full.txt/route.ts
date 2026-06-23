import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const revalidate = 3600; // CDN Edge cache for 1 hour

// Global cache variables in Node.js runtime memory
let cachedResponse: string | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

function stripMdxForLlm(content: string): string {
  let clean = content;
  // Remove import/export statements
  clean = clean.replace(/^import\s+[\s\S]*?\s+from\s+['"].*?['"];?/gm, '');
  clean = clean.replace(/^export\s+[\s\S]*?;/gm, '');

  // Strip MDX component tags but keep inner content (including AgentOnly)
  clean = clean.replace(/<[A-Z][a-zA-Z0-9]*\b[^>]*>([\s\S]*?)<\/[A-Z][a-zA-Z0-9]*>/g, '$1');
  clean = clean.replace(/<[a-z][a-zA-Z0-9]*\b[^>]*>([\s\S]*?)<\/[a-z][a-zA-Z0-9]*>/g, '$1');

  // Remove self-closing components
  clean = clean.replace(/<[^>]+?\/>/g, '');

  // Remove any remaining lone HTML tags
  clean = clean.replace(/<[^>]+>/g, '');

  // Convert markdown links to plain text with URL
  clean = clean.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // Keep code blocks as-is for LLMs, but remove backtick fences
  clean = clean.replace(/```[\w]*\n([\s\S]*?)```/g, '$1');

  // Remove inline code backticks
  clean = clean.replace(/`([^`]+)`/g, '$1');

  // Remove bold/italic markers
  clean = clean.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');

  // Normalize excessive whitespace
  clean = clean.replace(/\n{3,}/g, '\n\n');
  return clean.trim();
}

export async function GET() {
  const now = Date.now();
  if (cachedResponse && (now - lastCacheTime < CACHE_DURATION)) {
    return new Response(cachedResponse, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    const projectDir = process.cwd();
    const docsJsonPath = path.join(projectDir, 'docs.json');
    if (!fs.existsSync(docsJsonPath)) {
      return new Response('docs.json not found', { status: 500 });
    }

    const docsJson = JSON.parse(fs.readFileSync(docsJsonPath, 'utf-8'));
    if (!docsJson.navigation || !docsJson.navigation.products) {
      return new Response('Invalid docs.json structure', { status: 500 });
    }

    const lines: string[] = [];
    lines.push('# ABRAM Network — Complete Documentation');
    lines.push('');
    lines.push('> This file contains the complete text of all ABRAM documentation articles for LLM ingestion.');
    lines.push('> ABRAM is an AI-powered creative production management platform.');
    lines.push('');
    lines.push('---');

    // 1. Process index.mdx at the root (Introduction)
    const indexPath = path.join(projectDir, 'index.mdx');
    if (fs.existsSync(indexPath)) {
      const fileContent = fs.readFileSync(indexPath, 'utf-8');
      const { data, content } = matter(fileContent);
      const title = data.title || 'Overview';
      const cleanContent = stripMdxForLlm(content);
      lines.push('');
      lines.push(`## Introduction`);
      lines.push('');
      lines.push(`### ${title}`);
      lines.push('');
      if (data.description) {
        lines.push(`> ${data.description}`);
        lines.push('');
      }
      lines.push(cleanContent);
      lines.push('');
      lines.push('---');
    }

    // 2. Process groups in docs.json
    docsJson.navigation.products.forEach((productObj: any) => {
      if (!productObj.groups) return;

      productObj.groups.forEach((groupObj: any) => {
        lines.push('');
        lines.push(`## ${groupObj.group}`);
        lines.push('');

        if (!groupObj.pages) return;

        groupObj.pages.forEach((pagePath: string) => {
          const extensions = ['.md', '.mdx'];
          let fileContent = '';
          let foundPath = '';

          for (const ext of extensions) {
            const checkPath = path.join(projectDir, `${pagePath}${ext}`);
            if (fs.existsSync(checkPath)) {
              fileContent = fs.readFileSync(checkPath, 'utf-8');
              foundPath = checkPath;
              break;
            }
          }

          if (!fileContent) {
            // Try content/ folder as fallback
            const checkContentPath = path.join(projectDir, 'content', `${path.basename(pagePath)}`);
            for (const ext of extensions) {
              const fullCheck = `${checkContentPath}${ext}`;
              if (fs.existsSync(fullCheck)) {
                fileContent = fs.readFileSync(fullCheck, 'utf-8');
                foundPath = fullCheck;
                break;
              }
            }
          }

          if (fileContent) {
            try {
              const { data, content } = matter(fileContent);
              const title = data.title || path.basename(pagePath);
              const description = data.description || '';
              const cleanContent = stripMdxForLlm(content);

              lines.push(`### ${title}`);
              lines.push('');
              if (description) {
                lines.push(`> ${description}`);
                lines.push('');
              }
              lines.push(cleanContent);
              lines.push('');
              lines.push('---');
              lines.push('');
            } catch (err) {
              console.error(`Error processing file ${pagePath}:`, err);
            }
          }
        });
      });
    });

    const compiled = lines.join('\n');
    cachedResponse = compiled;
    lastCacheTime = now;

    return new Response(compiled, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Cache': 'MISS',
      },
    });
  } catch (error: any) {
    console.error('Error generating llms-full.txt route:', error);
    return new Response(`Error generating dynamic file: ${error.message}`, { status: 500 });
  }
}
