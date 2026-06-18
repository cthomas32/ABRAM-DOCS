const fs = require('fs');
const path = require('path');

function main() {
  const projectDir = path.resolve(__dirname, '..');
  const seedSqlPath = path.join(projectDir, 'scripts', 'seed.sql');
  
  if (!fs.existsSync(seedSqlPath)) {
    console.error('seed.sql not found');
    process.exit(1);
  }
  
  const content = fs.readFileSync(seedSqlPath, 'utf-8');
  // Split statements by the INSERT keyword (we know our script outputs them with a specific format)
  const parts = content.split('INSERT INTO public.help_docs');
  
  // The first part is 'DELETE FROM public.help_docs;\n\n      '
  const firstPart = parts[0];
  const insertStatements = parts.slice(1).map(p => 'INSERT INTO public.help_docs' + p);
  
  const chunks = [];
  const chunkSize = 11; // 10-11 statements per chunk
  
  for (let i = 0; i < insertStatements.length; i += chunkSize) {
    const chunk = insertStatements.slice(i, i + chunkSize);
    if (i === 0) {
      chunks.push(firstPart + '\n' + chunk.join('\n'));
    } else {
      chunks.push(chunk.join('\n'));
    }
  }
  
  chunks.forEach((chunkContent, idx) => {
    const outputPath = path.join(projectDir, 'scripts', `seed_chunk_${idx + 1}.sql`);
    fs.writeFileSync(outputPath, chunkContent, 'utf-8');
    console.log(`Wrote chunk ${idx + 1} with ${idx === 0 ? chunkContent.split('INSERT INTO').length - 1 : chunkContent.split('INSERT INTO').length - 1} inserts to ${outputPath}`);
  });
}

main();
