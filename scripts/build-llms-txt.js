/* eslint-disable */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

/**
 * Strip MDX component syntax but KEEP inner content (including AgentOnly).
 * Unlike the search-index version, this preserves AgentOnly content
 * since llms-full.txt is specifically for LLM/agent ingestion.
 */
function stripMdxForLlm(content) {
  let clean = content;

  // Remove import/export statements
  clean = clean.replace(/^import\s+[\s\S]*?\s+from\s+['"].*?['"];?/gm, '');
  clean = clean.replace(/^export\s+[\s\S]*?;/gm, '');

  // Strip MDX component tags but keep inner content (including AgentOnly)
  // This matches <ComponentName ...>inner content</ComponentName> and keeps inner content
  clean = clean.replace(/<[A-Z][a-zA-Z0-9]*\b[^>]*>([\s\S]*?)<\/[A-Z][a-zA-Z0-9]*>/g, '$1');

  // Strip lowercase HTML-like component tags, keep inner content
  clean = clean.replace(/<[a-z][a-zA-Z0-9]*\b[^>]*>([\s\S]*?)<\/[a-z][a-zA-Z0-9]*>/g, '$1');

  // Remove self-closing components
  clean = clean.replace(/<[^>]+?\/>/g, '');

  // Remove any remaining lone HTML tags
  clean = clean.replace(/<[^>]+>/g, '');

  // Convert markdown links to plain text with URL
  clean = clean.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // Keep code blocks as-is for LLMs (they can parse them)
  // But remove the backtick fences for cleaner text
  clean = clean.replace(/```[\w]*\n([\s\S]*?)```/g, '$1');

  // Remove inline code backticks
  clean = clean.replace(/`([^`]+)`/g, '$1');

  // Remove bold/italic markers
  clean = clean.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');

  // Normalize excessive whitespace (but preserve paragraph breaks)
  clean = clean.replace(/\n{3,}/g, '\n\n');
  clean = clean.trim();

  return clean;
}

function main() {
  console.log('Building llms-full.txt...');

  const projectDir = path.resolve(__dirname, '..');
  const publicDir = path.join(projectDir, 'public');
  const docsJsonPath = path.join(projectDir, 'docs.json');

  // Read docs.json
  if (!fs.existsSync(docsJsonPath)) {
    console.error('docs.json not found at', docsJsonPath);
    process.exit(1);
  }

  const docsJson = JSON.parse(fs.readFileSync(docsJsonPath, 'utf-8'));

  if (!docsJson.navigation || !docsJson.navigation.products) {
    console.error('Invalid docs.json structure: missing navigation.products');
    process.exit(1);
  }

  const sections = [];
  let totalArticles = 0;

  // Process each product and group
  docsJson.navigation.products.forEach((productObj) => {
    if (!productObj.groups) return;

    productObj.groups.forEach((groupObj) => {
      const groupName = groupObj.group;
      const articles = [];

      if (!groupObj.pages) return;

      groupObj.pages.forEach((pagePath) => {
        // Resolve file path (.md or .mdx)
        const mdxPath = path.join(projectDir, `${pagePath}.mdx`);
        const mdPath = path.join(projectDir, `${pagePath}.md`);

        let resolvedPath = '';
        if (fs.existsSync(mdxPath)) {
          resolvedPath = mdxPath;
        } else if (fs.existsSync(mdPath)) {
          resolvedPath = mdPath;
        }

        if (!resolvedPath) {
          console.warn(`Warning: File not found for ${pagePath}`);
          return;
        }

        try {
          const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
          const { data, content } = matter(fileContent);

          const title = data.title || data.sidebarTitle || path.basename(pagePath);
          const description = data.description || '';
          const cleanContent = stripMdxForLlm(content);

          articles.push({ title, description, content: cleanContent, pagePath });
          totalArticles++;
        } catch (err) {
          console.error(`Error processing ${resolvedPath}:`, err.message);
        }
      });

      if (articles.length > 0) {
        sections.push({ groupName, articles });
      }
    });
  });

  // Build the output
  const lines = [];

  lines.push('# ABRAM Network — Complete Documentation');
  lines.push('');
  lines.push('> This file contains the complete text of all ABRAM documentation articles for LLM ingestion.');
  lines.push('> ABRAM is an AI-powered creative production management platform that helps brands scale production');
  lines.push('> and freelancers build careers. It provides tools for AI-powered project intake (Brief Intelligence),');
  lines.push('> crew scheduling, talent matchmaking with suitability scoring, automated invoicing and payouts,');
  lines.push('> utilization calendars, and team management.');
  lines.push('');
  lines.push('---');

  sections.forEach((section) => {
    lines.push('');
    lines.push(`## ${section.groupName}`);
    lines.push('');

    section.articles.forEach((article, idx) => {
      lines.push(`### ${article.title}`);
      lines.push('');
      if (article.description) {
        lines.push(`> ${article.description}`);
        lines.push('');
      }
      lines.push(article.content);
      lines.push('');
      lines.push('---');
      lines.push('');
    });
  });

  const output = lines.join('\n');

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, 'llms-full.txt');
  fs.writeFileSync(outputPath, output, 'utf-8');

  const sizeKb = (Buffer.byteLength(output, 'utf-8') / 1024).toFixed(1);
  console.log(`Successfully generated llms-full.txt`);
  console.log(`  → ${totalArticles} articles across ${sections.length} groups`);
  console.log(`  → ${sizeKb} KB written to ${outputPath}`);
}

main();
