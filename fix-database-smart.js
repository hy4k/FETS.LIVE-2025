import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const projectRef = 'qqewusetilxxfvfkmsed';
const accessToken = 'sbp_4aaa4f554db8e17be2a4e83d01f7f448a68e636f';

console.log('🏥 FETSCONNECT DATABASE FIX UTILITY (Smart Executor)');
console.log('='.repeat(60));

async function executeSQLStatement(sql, description = '') {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query: sql })
    });

    const result = await response.json();

    if (!response.ok) {
      // Check if error is because object already exists (which is OK)
      if (result.message && (
        result.message.includes('already exists') ||
        result.message.includes('duplicate')
      )) {
        return { success: true, skipped: true, message: 'Already exists' };
      }
      return { success: false, error: result.message || JSON.stringify(result) };
    }

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Helper function to parse SQL into logical blocks
function parseSQLIntoBlocks(sql) {
  const blocks = [];
  let currentBlock = '';
  let inComment = false;
  let inString = false;
  let stringChar = '';

  const lines = sql.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments at start
    if (!trimmed || trimmed.startsWith('--')) {
      if (trimmed.startsWith('-- =====')) {
        // Section header - save current block if any
        if (currentBlock.trim()) {
          blocks.push(currentBlock.trim());
          currentBlock = '';
        }
      }
      continue;
    }

    // Skip multi-line comments
    if (trimmed.startsWith('/*')) {
      inComment = true;
      continue;
    }
    if (trimmed.includes('*/')) {
      inComment = false;
      continue;
    }
    if (inComment) continue;

    // Skip COMMIT statement
    if (trimmed === 'COMMIT;') continue;

    currentBlock += line + '\n';

    // Check if this is the end of a statement
    if (trimmed.endsWith(';')) {
      blocks.push(currentBlock.trim());
      currentBlock = '';
    }
  }

  // Add any remaining block
  if (currentBlock.trim()) {
    blocks.push(currentBlock.trim());
  }

  return blocks;
}

// Read SQL file
const sqlFilePath = join(__dirname, 'COMPREHENSIVE-FETSCONNECT-FIX.sql');
console.log(`📖 Reading SQL file...\n`);

try {
  const sql = readFileSync(sqlFilePath, 'utf-8');
  const blocks = parseSQLIntoBlocks(sql);

  console.log(`✅ Parsed ${blocks.length} SQL statements\n`);
  console.log('🚀 Executing statements...\n');

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const preview = block.split('\n')[0].substring(0, 60);

    process.stdout.write(`[${i + 1}/${blocks.length}] ${preview}...`);

    const result = await executeSQLStatement(block);

    if (result.success) {
      if (result.skipped) {
        console.log(' ⏭️  (exists)');
        skippedCount++;
      } else {
        console.log(' ✅');
        successCount++;
      }
    } else {
      console.log(` ❌`);
      errorCount++;
      errors.push({
        statement: preview,
        error: result.error
      });
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 EXECUTION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful:  ${successCount}`);
  console.log(`⏭️  Skipped:    ${skippedCount} (already exist)`);
  console.log(`❌ Failed:     ${errorCount}`);
  console.log('='.repeat(60));

  if (errors.length > 0 && errors.length < 10) {
    console.log('\n⚠️  ERRORS:\n');
    errors.forEach((err, idx) => {
      console.log(`${idx + 1}. ${err.statement}`);
      console.log(`   Error: ${err.error.substring(0, 150)}\n`);
    });
  }

  if (errorCount === 0) {
    console.log('\n🎉 All SQL statements executed successfully!');
    console.log('✅ Database fix completed!');
  } else if (errorCount < blocks.length / 2) {
    console.log('\n✅ Most statements succeeded. Database should be functional.');
    console.log('⚠️  Some errors encountered - review above for details.');
  } else {
    console.log('\n⚠️  Many errors encountered. Manual intervention may be needed.');
    console.log(`\n💡 Open SQL Editor: https://supabase.com/dashboard/project/${projectRef}/sql`);
  }
} catch (error) {
  console.error('\n💥 Script failed:', error.message);
  console.log(`\n💡 Manual execution: https://supabase.com/dashboard/project/${projectRef}/sql`);
  process.exit(1);
}
