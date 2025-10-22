import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const projectRef = 'qqewusetilxxfvfkmsed';
const accessToken = 'sbp_4aaa4f554db8e17be2a4e83d01f7f448a68e636f';

console.log('🏥 FETSCONNECT DATABASE FIX UTILITY');
console.log('='.repeat(60));

async function executeSQLViaAPI(sql) {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  console.log('🚀 Executing SQL via Supabase Management API...\n');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        query: sql
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', result);
      return { success: false, error: result };
    }

    console.log('✅ SQL executed successfully!');
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Network error:', error.message);
    return { success: false, error: error.message };
  }
}

// Read SQL file
const sqlFilePath = join(__dirname, 'COMPREHENSIVE-FETSCONNECT-FIX.sql');
console.log(`📖 Reading SQL file: ${sqlFilePath}\n`);

try {
  const sql = readFileSync(sqlFilePath, 'utf-8');
  console.log(`✅ Loaded ${sql.length} characters of SQL\n`);

  // Execute SQL
  const result = await executeSQLViaAPI(sql);

  if (result.success) {
    console.log('\n🎉 Database fix completed successfully!');
    console.log('✅ All tables and policies should now be in place.\n');
  } else {
    throw new Error('SQL execution failed');
  }
} catch (error) {
  console.error('\n💥 Script failed:', error.message);
  console.log('\n📋 MANUAL EXECUTION INSTRUCTIONS:');
  console.log('='.repeat(60));
  console.log('1. Open Supabase Dashboard:');
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log('');
  console.log('2. Copy the contents of COMPREHENSIVE-FETSCONNECT-FIX.sql');
  console.log('');
  console.log('3. Paste into the SQL Editor');
  console.log('');
  console.log('4. Click "Run" (or press Cmd/Ctrl + Enter)');
  console.log('');
  console.log('5. Wait for execution to complete');
  console.log('='.repeat(60));
  process.exit(1);
}
