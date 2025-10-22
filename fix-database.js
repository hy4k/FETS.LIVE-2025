import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration with service role key for admin operations
const supabaseUrl = 'https://qqewusetilxxfvfkmsed.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM2MjY1NSwiZXhwIjoyMDcwOTM4NjU1fQ.LJePJfsskt3HvoJvo9cWWDGaE0fOstb0tlmyYm5sWPo';

console.log('🔧 Initializing Supabase admin client...');

// Create Supabase client with service role for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('✅ Admin client created');

async function executeSQLFile(filePath) {
  try {
    console.log(`📖 Reading SQL file: ${filePath}`);
    const sql = readFileSync(filePath, 'utf-8');

    console.log('📝 SQL file loaded, length:', sql.length, 'characters');
    console.log('🚀 Executing SQL via Supabase REST API...\n');

    // Split SQL into individual statements (basic splitting by semicolon)
    // Note: This is a simple approach and may not handle all edge cases
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'COMMIT');

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Execute statements using Supabase RPC or direct query
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and empty statements
      if (statement.startsWith('/*') || statement.startsWith('--') || statement.trim() === '') {
        continue;
      }

      // Log statement type
      const firstWord = statement.split(/\s+/)[0].toUpperCase();
      process.stdout.write(`[${i + 1}/${statements.length}] Executing ${firstWord}... `);

      try {
        // Use raw SQL execution via Supabase REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`
          },
          body: JSON.stringify({ query: statement + ';' })
        });

        if (!response.ok) {
          // Try alternative approach: execute via database
          // For DDL statements, we need to use the Supabase Management API
          // or execute directly via SQL editor

          // As a workaround, try using supabase.rpc if available
          const { data, error } = await supabase.rpc('exec', { sql: statement + ';' });

          if (error) {
            throw new Error(error.message || `HTTP ${response.status}`);
          }
        }

        console.log('✅');
        successCount++;
      } catch (error) {
        console.log(`❌ ${error.message}`);
        errorCount++;
        errors.push({
          statement: statement.substring(0, 100) + (statement.length > 100 ? '...' : ''),
          error: error.message
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 EXECUTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log('='.repeat(60));

    if (errors.length > 0) {
      console.log('\n⚠️  ERRORS ENCOUNTERED:\n');
      errors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err.error}`);
        console.log(`   Statement: ${err.statement}\n`);
      });
      console.log('\n💡 TIP: Most errors can be ignored if tables/policies already exist.');
      console.log('    Use the Supabase Dashboard SQL Editor for manual execution if needed.');
    }

    return { successCount, errorCount, errors };
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

// Main execution
const sqlFilePath = join(__dirname, 'COMPREHENSIVE-FETSCONNECT-FIX.sql');

console.log('🏥 FETSCONNECT DATABASE FIX UTILITY');
console.log('='.repeat(60));
console.log('This script will execute the comprehensive database fix');
console.log('to resolve all FetsConnect issues.\n');

executeSQLFile(sqlFilePath)
  .then(result => {
    if (result.errorCount === 0) {
      console.log('\n🎉 All SQL statements executed successfully!');
      console.log('✅ Database fix completed!');
    } else {
      console.log('\n⚠️  Some statements failed. Check the errors above.');
      console.log('💡 You may need to run the SQL manually in Supabase Dashboard.');
    }
  })
  .catch(error => {
    console.error('\n💥 Script failed:', error.message);
    console.log('\n📋 ALTERNATIVE SOLUTION:');
    console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard/project/qqewusetilxxfvfkmsed');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the contents of COMPREHENSIVE-FETSCONNECT-FIX.sql');
    console.log('4. Click "Run" to execute the SQL');
    process.exit(1);
  });
