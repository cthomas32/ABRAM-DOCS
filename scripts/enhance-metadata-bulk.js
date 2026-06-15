const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Helper to recursively get md/mdx files
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
      if (ext.some(e => filePath.endsWith(e)) && !file.toLowerCase().includes('readme')) {
        results.push(filePath);
      }
    }
  });
  return results;
}

// Clean up markdown syntax to get clean plain-text paragraph
function getCleanText(content) {
  return content
    .replace(/#+\s+.+/g, '') // remove headings
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // simplify links
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // remove images
    .replace(/```[a-z]*\n[\s\S]*?\n```/g, '') // remove code blocks
    .replace(/<[^>]*>/g, '') // remove HTML/MDX tags
    .replace(/[*_`~]/g, '') // remove formatting characters
    .trim();
}

const COMMON_TERMS = [
  'stripe', 'milestone', 'freelancer', 'producer', 'calendar', 'slack',
  'intake', 'ai', 'brief', 'security', 'work package', 'workflow', 'payout',
  'invoice', 'collaboration', 'crew', 'scheduling', 'permissions', 'onboarding',
  'billing', 'ledger', 'copilot', 'talent search', 'matchmaking', 'rsvp'
];

function generateKeywords(content, title) {
  const keywordsSet = new Set(['ABRAM', 'ABRAM Network']);
  const lowercaseContent = content.toLowerCase();
  const lowercaseTitle = title.toLowerCase();

  // Add matching standard terms
  COMMON_TERMS.forEach((term) => {
    if (lowercaseContent.includes(term) || lowercaseTitle.includes(term)) {
      keywordsSet.add(term);
    }
  });

  // Extract nouns/adjectives from the title
  const titleWords = title
    .replace(/^\d+(\.\d+)*-/, '') // Remove numbering
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['section', 'guide', 'and', 'your', 'with'].includes(w.toLowerCase()));

  titleWords.forEach(w => keywordsSet.add(w.toLowerCase()));

  return Array.from(keywordsSet);
}

function processFile(filePath, dryRun = false) {
  console.log(`Processing: ${path.basename(filePath)}`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  let parsed;
  try {
    parsed = matter(fileContent);
  } catch (err) {
    console.error(`Error parsing frontmatter for ${filePath}:`, err);
    return;
  }

  const data = { ...parsed.data };
  const content = parsed.content;

  // 1. Resolve Title
  let title = data.title || '';
  if (!title) {
    const match = content.match(/^#\s+(.+)$/m);
    title = match ? match[1].trim() : '';
  }
  if (!title) {
    // Fallback to filename conversion
    const baseName = path.basename(filePath, path.extname(filePath));
    title = baseName
      .replace(/^\d+(\.\d+)*-/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  // 2. Resolve Sidebar Title
  let sidebarTitle = data.sidebarTitle || '';
  if (!sidebarTitle) {
    sidebarTitle = title
      .replace(/^Section\s+\d+(\.\d+)*:\s*/i, '') // Remove "Section X.Y: "
      .trim();
  }

  // 3. Resolve Description
  let description = data.description || '';
  if (!description) {
    const cleanContent = getCleanText(content);
    if (cleanContent) {
      const paragraphs = cleanContent.split('\n').map(p => p.trim()).filter(Boolean);
      if (paragraphs.length > 0) {
        description = paragraphs[0];
        if (description.length > 155) {
          description = description.slice(0, 152) + '...';
        }
      }
    }
  }
  if (!description) {
    description = `Official guide covering ${sidebarTitle.toLowerCase()} inside the ABRAM help center and documentation workspace.`;
  }

  // 4. Resolve Keywords
  let keywords = data.keywords || data.tags || [];
  if (typeof keywords === 'string') {
    keywords = keywords.split(',').map(k => k.trim()).filter(Boolean);
  }
  if (keywords.length === 0) {
    keywords = generateKeywords(content, title);
  }

  // Map back values
  data.title = title;
  data.sidebarTitle = sidebarTitle;
  data.description = description;
  data.keywords = keywords;

  // Re-generate file content
  const updatedContent = matter.stringify(content, data);

  if (dryRun) {
    console.log(`[DRY RUN] Would write to ${path.basename(filePath)}:\n---`);
    console.log(matter.stringify('', data).trim());
    console.log('---\n');
  } else {
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    console.log(`[UPDATED] ${path.basename(filePath)}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetFileArg = args.find(arg => arg.startsWith('--file='));
  
  const projectDir = path.resolve(__dirname, '..');
  const userGuideDir = path.join(projectDir, 'user-guide');

  if (targetFileArg) {
    const filename = targetFileArg.split('=')[1];
    const absolutePath = path.isAbsolute(filename) ? filename : path.join(userGuideDir, filename);
    if (fs.existsSync(absolutePath)) {
      processFile(absolutePath, dryRun);
    } else {
      console.error(`File not found: ${absolutePath}`);
    }
  } else {
    console.log(`Scanning directory: ${userGuideDir}`);
    const files = getFiles(userGuideDir, ['.md', '.mdx']);
    console.log(`Found ${files.length} markdown files.`);
    files.forEach((filePath) => {
      processFile(filePath, dryRun);
    });
  }
}

main();
