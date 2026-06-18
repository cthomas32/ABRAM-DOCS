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

function stripMdx(content) {
  let clean = content.replace(/<AgentOnly(?:\s+[^>]*?)?>[\s\S]*?<\/AgentOnly>/gi, '');
  clean = clean.replace(/^import\s+[\s\S]*?\s+from\s+['"].*?['"];?/gm, '');
  clean = clean.replace(/^export\s+[\s\S]*?;/gm, '');
  clean = clean.replace(/<[A-Z][a-zA-Z0-9]*\b[^>]*>([\s\S]*?)<\/[A-Z][a-zA-Z0-9]*>/g, '$1');
  clean = clean.replace(/<[a-z][a-zA-Z0-9]*\b[^>]*>([\s\S]*?)<\/[a-z][a-zA-Z0-9]*>/g, '$1');
  clean = clean.replace(/<[^>]+?\/>/g, '');
  clean = clean.replace(/<[^>]+>/g, '');
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  clean = clean.replace(/```[\s\S]*?```/g, '');
  clean = clean.replace(/`([^`]+)`/g, '$1');
  clean = clean.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');
  clean = clean.replace(/^\s*#+\s+/gm, '');
  clean = clean.replace(/^\s*[-*+]\s+/gm, '');
  clean = clean.replace(/^\s*\d+\.\s+/gm, '');
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean;
}

function generateNavigationIndex(docsJson, docMap) {
  if (!docsJson || !docsJson.navigation || !docsJson.navigation.products) {
    return [];
  }
  
  const pages = [];
  
  docsJson.navigation.products.forEach((productObj) => {
    const productName = productObj.product;
    if (!productObj.groups) return;
    
    productObj.groups.forEach((groupObj) => {
      const groupName = groupObj.group;
      if (!groupObj.pages) return;
      
      groupObj.pages.forEach((pagePath) => {
        let title = '';
        const doc = docMap[pagePath];
        
        let metadata = {};
        if (doc && doc.content) {
          try {
            const { data } = matter(doc.content);
            metadata = data;
          } catch (e) {}
        }
        
        title = metadata.sidebarTitle || metadata.title || (doc ? doc.sidebar_title || doc.title : '') || '';
        
        if (!title) {
          const filename = path.basename(pagePath);
          title = filename
            .replace(/^\d+(\.\d+)*-/, '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
        }
        
        pages.push({
          slug: pagePath.split('/'),
          path: pagePath,
          title,
          group: groupName,
          groupIcon: groupObj.icon || 'book-open',
          product: productName
        });
      });
    });
  });
  
  // Include overview index page from Supabase slug "overview"
  const overviewDoc = docMap['overview'];
  let overviewTitle = 'Overview';
  if (overviewDoc && overviewDoc.content) {
    try {
      const { data } = matter(overviewDoc.content);
      overviewTitle = data.sidebarTitle || data.title || overviewDoc.sidebar_title || overviewDoc.title || 'Overview';
    } catch (e) {}
  }
  
  pages.unshift({
    slug: ['overview'],
    path: 'overview',
    title: overviewTitle,
    group: 'Introduction',
    groupIcon: 'book-open',
    product: docsJson.name || 'Help Center'
  });
  
  return pages;
}

async function main() {
  console.log('Starting search index generation...');
  
  const projectDir = path.resolve(__dirname, '..');
  const publicDir = path.join(projectDir, 'public');
  const utilsDir = path.join(projectDir, 'src/utils');
  const docsJsonPath = path.join(projectDir, 'docs.json');
  
  // Load environment variables from .env.local
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
  
  console.log('Fetching articles from Supabase...');
  const { data: dbDocs, error } = await supabase
    .from('help_docs')
    .select('slug, title, sidebar_title, description, keywords, content');
    
  if (error) {
    console.error('Error fetching articles from Supabase:', error);
    process.exit(1);
  }
  
  console.log(`Fetched ${dbDocs.length} articles from Supabase.`);
  
  const docMap = {};
  dbDocs.forEach((doc) => {
    docMap[doc.slug] = doc;
  });
  
  let docsJson = null;
  if (fs.existsSync(docsJsonPath)) {
    docsJson = JSON.parse(fs.readFileSync(docsJsonPath, 'utf-8'));
  }
  
  console.log('Generating navigation data...');
  const navPages = generateNavigationIndex(docsJson, docMap);
  
  const indexRecords = [];
  
  navPages.forEach((page) => {
    const doc = docMap[page.path];
    
    if (doc) {
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
        
        // 1. Content Status Validation (Skip drafts)
        if (metadata.status === 'draft') {
          console.log(`Skipping draft file from search index: ${page.path}`);
          return;
        }

        // 2. Publish Date Validation (Skip future publications)
        if (metadata.publishDate) {
          const publishTime = new Date(metadata.publishDate).getTime();
          const currentTime = new Date().getTime();
          if (publishTime > currentTime) {
            console.log(`Skipping scheduled file (publish date in future): ${page.path}`);
            return;
          }
        }

        const slug = page.path === '' ? 'index' : page.path;
        const title = metadata.title || doc.title || page.title;
        const description = metadata.description || doc.description || '';
        const cleanContent = stripMdx(rawContent);
        
        indexRecords.push({
          slug,
          title,
          description,
          content: cleanContent
        });
      } catch (err) {
        console.error(`Error parsing document ${page.path}:`, err);
      }
    } else {
      console.warn(`Warning: Document for page ${page.path} not found in database!`);
    }
  });
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const outputPath = path.join(publicDir, 'search-index.json');
  fs.writeFileSync(outputPath, JSON.stringify(indexRecords, null, 2), 'utf-8');
  console.log(`Successfully generated search index with ${indexRecords.length} records at ${outputPath}`);
  
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
  }
  
  const navDataPath = path.join(utilsDir, 'navigation-data.json');
  fs.writeFileSync(navDataPath, JSON.stringify(navPages, null, 2), 'utf-8');
  console.log(`Successfully generated navigation data with ${navPages.length} pages at ${navDataPath}`);
}

main();
