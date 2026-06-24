const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

function validate() {
  console.log('=== Documentation Validation Starting ===');

  const projectDir = path.resolve(__dirname, '..');
  const docsJsonPath = path.join(projectDir, 'docs.json');
  const userGuideDir = path.join(projectDir, 'user-guide');

  if (!fs.existsSync(docsJsonPath)) {
    console.error('ERROR: docs.json not found!');
    process.exit(1);
  }

  if (!fs.existsSync(userGuideDir)) {
    console.error('ERROR: user-guide directory not found at the root!');
    process.exit(1);
  }

  // 1. Parse docs.json
  let docsJson;
  try {
    docsJson = JSON.parse(fs.readFileSync(docsJsonPath, 'utf-8'));
  } catch (err) {
    console.error('ERROR: Failed to parse docs.json:', err.message);
    process.exit(1);
  }

  const navPages = [];
  if (docsJson.navigation && docsJson.navigation.products) {
    docsJson.navigation.products.forEach((product) => {
      if (product.groups) {
        product.groups.forEach((group) => {
          if (group.pages) {
            group.pages.forEach((page) => {
              navPages.push(page);
            });
          }
        });
      }
    });
  }

  console.log(`Parsed docs.json navigation: Found ${navPages.length} pages.`);

  // 2. Check file existence
  let missingFiles = 0;
  navPages.forEach((pagePath) => {
    const fullMdxPath = path.join(projectDir, `${pagePath}.mdx`);
    const fullMdPath = path.join(projectDir, `${pagePath}.md`);
    
    if (!fs.existsSync(fullMdxPath) && !fs.existsSync(fullMdPath)) {
      console.error(`  [MISSING FILE] Listed in docs.json but file does not exist: ${pagePath}`);
      missingFiles++;
    }
  });

  // 3. Check orphaned files
  let orphanedFiles = 0;
  const actualFiles = fs.readdirSync(userGuideDir)
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((file) => `user-guide/${file}`);

  actualFiles.forEach((file) => {
    // README.md is allowed to be not in navigation
    if (file.endsWith('README.md')) return;

    // Remove extension to compare with docs.json entry
    const cleanPath = file.replace(/\.mdx?$/, '');
    if (!navPages.includes(cleanPath)) {
      console.warn(`  [ORPHANED FILE] Exists in user-guide/ but not listed in docs.json: ${file}`);
      orphanedFiles++;
    }
  });

  // 4. Validate links in all markdown files
  let checkedLinksCount = 0;
  let brokenLinksCount = 0;

  const mdFilesToScan = fs.readdirSync(userGuideDir)
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'));

  // Add index.mdx if it exists at root
  const rootIndexMdx = path.join(projectDir, 'index.mdx');
  const filesToScan = [...mdFilesToScan.map(f => path.join(userGuideDir, f))];
  if (fs.existsSync(rootIndexMdx)) {
    filesToScan.push(rootIndexMdx);
  } else {
    // Check content/index.mdx if still there
    const contentIndexMdx = path.join(projectDir, 'content/index.mdx');
    if (fs.existsSync(contentIndexMdx)) {
      filesToScan.push(contentIndexMdx);
    }
  }

  filesToScan.forEach((filePath) => {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const relativeFilename = path.relative(projectDir, filePath);
    
    // Regex to find markdown links: [text](href)
    // Matches internal links: relative paths, absolute /user-guide paths
    // Ignore external URLs: http, https, mailto, tel, absolute domain paths starting with //, and pure anchors starting with #
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(fileContent)) !== null) {
      const href = match[2];
      checkedLinksCount++;

      const isExternal =
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('//') ||
        href.startsWith('#');

      if (!isExternal) {
        // Strip query params or hash/anchor
        let cleanHref = href.split('?')[0].split('#')[0];
        if (cleanHref === '') continue; // Link to hash on same page

        let resolvedPath;
        if (cleanHref.startsWith('/')) {
          // Resolve root-relative link (e.g. /user-guide/0.0-...)
          // It should point to the root-relative path in the project
          // If it links to /user-guide/..., resolve it relative to project root
          if (cleanHref.startsWith('/user-guide/')) {
            resolvedPath = path.join(projectDir, cleanHref);
          } else if (fs.existsSync(path.join(projectDir, 'src/app', cleanHref.replace(/^\//, '')))) {
            // Valid app route in Next.js
            continue;
          } else {
            console.warn(`  [UNKNOWN ROOT PATH] Link starts with / in ${relativeFilename}: ${href}`);
            brokenLinksCount++;
            continue;
          }
        } else {
          // Resolve relative path relative to the file's parent directory
          resolvedPath = path.resolve(path.dirname(filePath), cleanHref);
        }

        // Try to match file with exact match, or by appending .md or .mdx
        const targetExists = fs.existsSync(resolvedPath) ||
                             fs.existsSync(resolvedPath + '.md') ||
                             fs.existsSync(resolvedPath + '.mdx');

        if (!targetExists) {
          console.error(`  [BROKEN LINK] In ${relativeFilename}: "${href}" (Resolved path does not exist: ${resolvedPath})`);
          brokenLinksCount++;
        }
      }
    }
  });

  console.log('\n=== Summary ===');
  console.log(`- Missing Files in docs.json: ${missingFiles}`);
  console.log(`- Orphaned Files in user-guide/: ${orphanedFiles}`);
  console.log(`- Total Internal Links Checked: ${checkedLinksCount}`);
  console.log(`- Broken Links Found: ${brokenLinksCount}`);
  console.log('==================================');

  if (missingFiles > 0 || brokenLinksCount > 0) {
    console.error('Validation failed: Errors were detected.');
    process.exit(1);
  } else {
    console.log('Validation passed: Everything looks clean!');
  }
}

validate();
