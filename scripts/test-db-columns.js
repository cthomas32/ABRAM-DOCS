const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
  const projectDir = path.resolve(__dirname, '..');
  loadEnvLocal(projectDir);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Credentials not found in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Try selecting a row with welcome_email_sent_at to see if it exists
  const { data, error } = await supabase
    .from('subscribers')
    .select('email, welcome_email_sent_at')
    .limit(1);

  if (error) {
    console.error('Error selecting column:', error);
  } else {
    console.log('Success! welcome_email_sent_at column exists. Row sample:', data);
  }
}

main().catch(console.error);
