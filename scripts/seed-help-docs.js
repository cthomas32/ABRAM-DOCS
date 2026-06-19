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

async function seed() {
  const projectDir = path.resolve(__dirname, '..');
  loadEnvLocal(projectDir);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Credentials not found');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const docs = [];

  // 1. Root index.mdx
  const indexPath = path.join(projectDir, 'index.mdx');
  if (fs.existsSync(indexPath)) {
    const fileContent = fs.readFileSync(indexPath, 'utf-8');
    const { data, content } = matter(fileContent);
    docs.push({
      slug: 'overview',
      title: data.title || 'Overview',
      sidebar_title: data.sidebarTitle || 'Overview',
      description: data.description || '',
      keywords: data.keywords || [],
      content: fileContent
    });
  }

  // 2. user-guide directory
  const userGuideDir = path.join(projectDir, 'user-guide');
  const userGuideFiles = getFiles(userGuideDir, ['.md', '.mdx']);
  userGuideFiles.forEach(file => {
    const relativePath = path.relative(projectDir, file);
    const slug = relativePath.replace(/\.(md|mdx)$/, '');
    const fileContent = fs.readFileSync(file, 'utf-8');
    const { data } = matter(fileContent);

    docs.push({
      slug,
      title: data.title || '',
      sidebar_title: data.sidebarTitle || '',
      description: data.description || '',
      keywords: data.keywords || [],
      content: fileContent
    });
  });

  // 3. content directory
  const contentDir = path.join(projectDir, 'content');
  const contentFiles = getFiles(contentDir, ['.md', '.mdx']);
  contentFiles.forEach(file => {
    const relativePath = path.relative(projectDir, file);
    const slug = relativePath.replace(/\.(md|mdx)$/, '');
    const fileContent = fs.readFileSync(file, 'utf-8');
    const { data } = matter(fileContent);

    docs.push({
      slug,
      title: data.title || '',
      sidebar_title: data.sidebarTitle || '',
      description: data.description || '',
      keywords: data.keywords || [],
      content: fileContent
    });
  });

  console.log(`Upserting ${docs.length} documents into Supabase...`);

  for (const doc of docs) {
    const { error } = await supabase
      .from('help_docs')
      .upsert(doc, { onConflict: 'slug' });
    if (error) {
      console.error(`Failed to upsert slug ${doc.slug}:`, error);
    } else {
      console.log(`Upserted ${doc.slug}`);
    }
  }

  console.log('Seeding complete!');
}

seed().catch(console.error);
