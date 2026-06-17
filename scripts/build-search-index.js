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

function generateNavigationIndex(contentDir, projectDir) {
  const docsJsonPath = path.join(projectDir, 'docs.json');
  
  let docsJson = null;
  
  // Read docs.json
  if (fs.existsSync(docsJsonPath)) {
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
          groupIcon: groupObj.icon || 'book-open',
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
        slug: ['overview'],
        path: 'overview',
        title: data.sidebarTitle || data.title || 'Overview',
        group: 'Introduction',
        groupIcon: 'book-open',
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
  const publicDir = path.join(projectDir, 'public');
  const utilsDir = path.join(projectDir, 'src/utils');
  
  // Generate navigation data first from the project root
  console.log('Generating navigation data...');
  const navPages = generateNavigationIndex(projectDir, projectDir);
  
  const indexRecords = [];
  
  navPages.forEach((page) => {
    let filePath = '';
    if (page.path === 'overview') {
      filePath = path.join(projectDir, 'index.mdx');
    } else {
      const mdxPath = path.join(projectDir, `${page.path}.mdx`);
      const mdPath = path.join(projectDir, `${page.path}.md`);
      if (fs.existsSync(mdxPath)) {
        filePath = mdxPath;
      } else if (fs.existsSync(mdPath)) {
        filePath = mdPath;
      }
    }
    
    if (filePath && fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(fileContent);
        
        const slug = page.path === '' ? 'index' : page.path;
        const title = data.title || page.title;
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
    } else {
      console.warn(`Warning: File for page ${page.path || 'index'} not found!`);
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
