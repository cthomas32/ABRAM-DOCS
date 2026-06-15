/* eslint-disable */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Helper to recursively get files
function getFiles(dir, ext) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath, ext));
    } else {
      if (ext.some(e => filePath.endsWith(e))) {
        results.push(filePath);
      }
    }
  });
  return results;
}

// Function to copy backup files to content
function ensureContentDir(contentDir, backupDir) {
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
  }
  
  // Check if content dir is empty
  const files = fs.readdirSync(contentDir);
  if (files.length === 0 && fs.existsSync(backupDir)) {
    console.log('Populating content folder from _mintlify_backup...');
    copyRecursiveSync(backupDir, contentDir);
  }
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      if (childItemName === 'docs.json' || childItemName === 'logo' || childItemName === 'search.js') {
        return;
      }
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    if (src.endsWith('.mdx') || src.endsWith('.md')) {
      fs.copyFileSync(src, dest);
    }
  }
}

function stripMdx(content) {
  let clean = content.replace(/^import\s+[\s\S]*?\s+from\s+['"].*?['"];?/gm, '');
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

function generateNavigationIndex(contentDir, projectDir) {
  const docsJsonPath = path.join(projectDir, 'docs.json');
  const backupDocsJsonPath = path.join(projectDir, '_mintlify_backup', 'docs.json');
  
  let docsJson = null;
  
  // Read docs.json
  if (fs.existsSync(docsJsonPath)) {
    docsJson = JSON.parse(fs.readFileSync(docsJsonPath, 'utf-8'));
  } else if (fs.existsSync(backupDocsJsonPath)) {
    // Copy docs.json to project root if it doesn't exist
    fs.copyFileSync(backupDocsJsonPath, docsJsonPath);
    docsJson = JSON.parse(fs.readFileSync(docsJsonPath, 'utf-8'));
  }
  
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
        const mdxPath = path.join(contentDir, `${pagePath}.mdx`);
        const mdPath = path.join(contentDir, `${pagePath}.md`);
        let title = '';
        
        let resolvedPath = '';
        if (fs.existsSync(mdxPath)) {
          resolvedPath = mdxPath;
        } else if (fs.existsSync(mdPath)) {
          resolvedPath = mdPath;
        }
        
        if (resolvedPath) {
          try {
            const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
            const { data } = matter(fileContent);
            title = data.sidebarTitle || data.title || '';
          } catch (e) {
            console.error(`Error parsing frontmatter for ${pagePath}:`, e);
          }
        }
        
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
          product: productName
        });
      });
    });
  });
  
  // Include index.mdx from the root of content/ as slug []
  const indexPath = path.join(contentDir, 'index.mdx');
  if (fs.existsSync(indexPath)) {
    try {
      const fileContent = fs.readFileSync(indexPath, 'utf-8');
      const { data } = matter(fileContent);
      pages.unshift({
        slug: [],
        path: '',
        title: data.sidebarTitle || data.title || 'Introduction',
        group: 'Introduction',
        product: docsJson.name || 'Help Center'
      });
    } catch (e) {
      console.error('Error parsing index.mdx:', e);
    }
  }
  
  return pages;
}

function main() {
  console.log('Starting search index generation...');
  
  const projectDir = path.resolve(__dirname, '..');
  const contentDir = path.join(projectDir, 'content');
  const publicDir = path.join(projectDir, 'public');
  const utilsDir = path.join(projectDir, 'src/utils');
  
  // Ensure content directory is populated
  ensureContentDir(contentDir, path.join(projectDir, '_mintlify_backup'));
  
  if (!fs.existsSync(contentDir)) {
    console.error(`Content directory not found at: ${contentDir}`);
    process.exit(1);
  }
  
  // Find all .mdx and .md files recursively in content directory
  const files = getFiles(contentDir, ['.mdx', '.md']);
  console.log(`Found ${files.length} markdown files to index.`);
  
  const indexRecords = [];
  
  files.forEach((filePath) => {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);
      
      const relativePath = path.relative(contentDir, filePath);
      const slug = relativePath.replace(/\\/g, '/').replace(/\.mdx?$/, '');
      
      const title = data.title || path.basename(filePath, path.extname(filePath));
      const description = data.description || '';
      const cleanContent = stripMdx(content);
      
      indexRecords.push({
        slug,
        title,
        description,
        content: cleanContent
      });
    } catch (err) {
      console.error(`Error parsing ${filePath}:`, err);
    }
  });
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const outputPath = path.join(publicDir, 'search-index.json');
  fs.writeFileSync(outputPath, JSON.stringify(indexRecords, null, 2), 'utf-8');
  console.log(`Successfully generated search index with ${indexRecords.length} records at ${outputPath}`);
  
  // Generate navigation data
  console.log('Generating navigation data...');
  const navPages = generateNavigationIndex(contentDir, projectDir);
  
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
  }
  
  const navDataPath = path.join(utilsDir, 'navigation-data.json');
  fs.writeFileSync(navDataPath, JSON.stringify(navPages, null, 2), 'utf-8');
  console.log(`Successfully generated navigation data with ${navPages.length} pages at ${navDataPath}`);
}

main();
