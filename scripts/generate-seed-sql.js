const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

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

function pgEscapeString(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function pgEscapeTextArray(arr) {
  if (!arr || !Array.isArray(arr)) return "'{}'::text[]";
  const escapedItems = arr.map(item => `"${String(item).replace(/"/g, '\\"')}"`);
  return `'` + `{${escapedItems.join(',')}}` + `'::text[]`;
}

function main() {
  const projectDir = path.resolve(__dirname, '..');
  const sqlStatements = ['DELETE FROM public.help_docs;']; // Clear existing data to start clean

  // 1. Root index.mdx
  const indexPath = path.join(projectDir, 'index.mdx');
  if (fs.existsSync(indexPath)) {
    const fileContent = fs.readFileSync(indexPath, 'utf-8');
    const { data } = matter(fileContent);
    sqlStatements.push(`
      INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        'overview',
        ${pgEscapeString(data.title || 'Overview')},
        ${pgEscapeString(data.sidebarTitle || 'Overview')},
        ${pgEscapeString(data.description || '')},
        ${pgEscapeTextArray(data.keywords || [])},
        ${pgEscapeString(fileContent)}
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    `);
  }

  // 2. user-guide directory
  const userGuideDir = path.join(projectDir, 'user-guide');
  const userGuideFiles = getFiles(userGuideDir, ['.md', '.mdx']);
  userGuideFiles.forEach(file => {
    const relativePath = path.relative(projectDir, file);
    const slug = relativePath.replace(/\.(md|mdx)$/, '');
    const fileContent = fs.readFileSync(file, 'utf-8');
    const { data } = matter(fileContent);

    sqlStatements.push(`
      INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        ${pgEscapeString(slug)},
        ${pgEscapeString(data.title || '')},
        ${pgEscapeString(data.sidebarTitle || '')},
        ${pgEscapeString(data.description || '')},
        ${pgEscapeTextArray(data.keywords || [])},
        ${pgEscapeString(fileContent)}
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    `);
  });

  // 3. content directory
  const contentDir = path.join(projectDir, 'content');
  const contentFiles = getFiles(contentDir, ['.md', '.mdx']);
  contentFiles.forEach(file => {
    const relativePath = path.relative(projectDir, file);
    const slug = relativePath.replace(/\.(md|mdx)$/, '');
    const fileContent = fs.readFileSync(file, 'utf-8');
    const { data } = matter(fileContent);

    sqlStatements.push(`
      INSERT INTO public.help_docs (slug, title, sidebar_title, description, keywords, content)
      VALUES (
        ${pgEscapeString(slug)},
        ${pgEscapeString(data.title || '')},
        ${pgEscapeString(data.sidebarTitle || '')},
        ${pgEscapeString(data.description || '')},
        ${pgEscapeTextArray(data.keywords || [])},
        ${pgEscapeString(fileContent)}
      ) ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        sidebar_title = EXCLUDED.sidebar_title,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        content = EXCLUDED.content,
        updated_at = now();
    `);
  });

  const outputPath = path.join(projectDir, 'scripts', 'seed.sql');
  fs.writeFileSync(outputPath, sqlStatements.join('\n'), 'utf-8');
  console.log(`Successfully generated SQL seed queries at ${outputPath}`);
}

main();
