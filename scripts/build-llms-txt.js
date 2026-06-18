/* eslint-disable */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { createClient } = require('@supabase/supabase-js');

// Helper to parse .env.local manually
function loadEnvLocal(projectDir) {
  const envPath = path.join(projectDir, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index === -1) return;
      const key = trimmed.substring(0, index).trim();
      const val = trimmed.substring(index + 1).trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    });
  }
}

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

async function main() {
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

  // Load environment variables
  loadEnvLocal(projectDir);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase environment variables not found in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  console.log('Fetching articles from Supabase for LLM text file...');
  const { data: dbDocs, error } = await supabase
    .from('help_docs')
    .select('slug, title, sidebar_title, description, content');

  if (error) {
    console.error('Error fetching articles from Supabase:', error);
    process.exit(1);
  }

  console.log(`Fetched ${dbDocs.length} articles from Supabase.`);

  const docMap = {};
  dbDocs.forEach((doc) => {
    docMap[doc.slug] = doc;
  });

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
        const doc = docMap[pagePath];

        if (!doc) {
          console.warn(`Warning: Document not found in DB for page ${pagePath}`);
          return;
        }

        try {
          let metadata = {};
          let rawContent = doc.content || '';

          if (doc.content) {
            try {
              const { data, content } = matter(doc.content);
              metadata = data;
              rawContent = content;
            } catch (err) {
              metadata = {
                title: doc.title,
                description: doc.description
              };
            }
          }

          const title = metadata.title || doc.title || doc.sidebar_title || path.basename(pagePath);
          const description = metadata.description || doc.description || '';
          const cleanContent = stripMdxForLlm(rawContent);

          articles.push({ title, description, content: cleanContent, pagePath });
          totalArticles++;
        } catch (err) {
          console.error(`Error processing ${pagePath}:`, err.message);
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
