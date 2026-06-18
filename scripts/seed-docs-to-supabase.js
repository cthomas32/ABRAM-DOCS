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

async function main() {
  console.log('Starting Supabase help center docs seeding...');

  const projectDir = path.resolve(__dirname, '..');
  loadEnvLocal(projectDir);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase credentials not found in .env.local');
    process.exit(1);
  }

  console.log(`Connecting to Supabase project at: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const docsToUpsert = [];

  // 1. Process index.mdx (overview)
  const indexPath = path.join(projectDir, 'index.mdx');
  if (fs.existsSync(indexPath)) {
    console.log('Processing index.mdx (overview)...');
    const rawContent = fs.readFileSync(indexPath, 'utf-8');
    const { data } = matter(rawContent);

    // Extract title, description, and keywords
    const title = data.title || 'Welcome to the ABRAM Help Center';
    const sidebarTitle = data.sidebarTitle || 'Overview';
    const description = data.description || '';
    
    let keywords = [];
    if (Array.isArray(data.keywords)) {
      keywords = data.keywords.map(k => String(k).trim());
    } else if (typeof data.keywords === 'string') {
      keywords = data.keywords.split(',').map(k => k.trim()).filter(Boolean);
    }

    docsToUpsert.push({
      slug: 'overview',
      title,
      sidebar_title: sidebarTitle,
      description,
      content: rawContent, // Store raw content with frontmatter
      keywords,
    });
  } else {
    console.warn('Warning: index.mdx not found at root.');
  }

  // 2. Process user-guide/*.{md,mdx}
  const userGuideDir = path.join(projectDir, 'user-guide');
  if (fs.existsSync(userGuideDir)) {
    console.log('Processing user-guide directory...');
    const files = fs.readdirSync(userGuideDir);
    
    files.forEach((file) => {
      const ext = path.extname(file);
      if (ext !== '.md' && ext !== '.mdx') return;
      if (file === 'README.md') {
        console.log('Skipping user-guide/README.md from seeding.');
        return;
      }

      const filePath = path.join(userGuideDir, file);
      const rawContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(rawContent);

      const basename = path.basename(file, ext);
      const slug = `user-guide/${basename}`;

      // Extract title, description, and keywords
      let title = data.title || '';
      if (!title) {
        const match = content.match(/^#\s+(.+)$/m);
        title = match ? match[1].trim() : basename.replace(/-/g, ' ');
      }
      const sidebarTitle = data.sidebarTitle || null;
      const description = data.description || '';
      
      let keywords = [];
      if (Array.isArray(data.keywords)) {
        keywords = data.keywords.map(k => String(k).trim());
      } else if (typeof data.keywords === 'string') {
        keywords = data.keywords.split(',').map(k => k.trim()).filter(Boolean);
      }

      docsToUpsert.push({
        slug,
        title,
        sidebar_title: sidebarTitle,
        description,
        content: rawContent, // Store raw content with frontmatter
        keywords,
      });
      console.log(`Processed ${slug}`);
    });
  } else {
    console.warn('Warning: user-guide directory not found.');
  }

  if (docsToUpsert.length === 0) {
    console.log('No documents found to upsert.');
    return;
  }

  console.log(`Upserting ${docsToUpsert.length} documents to Supabase...`);

  // Batch upsert to help_docs
  const { data, error } = await supabase
    .from('help_docs')
    .upsert(docsToUpsert, { onConflict: 'slug' });

  if (error) {
    console.error('Error seeding documents to Supabase:', error);
    process.exit(1);
  }

  console.log('Seeding completed successfully!');
}

main().catch((err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});
