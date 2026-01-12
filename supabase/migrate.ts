/**
 * Database Migration Helper Script
 * 
 * This script helps verify and apply database migrations.
 * Run with: npx ts-node supabase/migrate.ts
 * 
 * Or use the SQL file directly in Supabase SQL Editor:
 * supabase/migrations/apply_migration.sql
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface MigrationResult {
  success: boolean;
  tables?: Record<string, number>;
  error?: string;
}

async function verifySchema(): Promise<MigrationResult> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return {
      success: false,
      error: 'Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Check if tables exist
    const tablesToCheck = ['students', 'fees_records'];
    const tableInfo: Record<string, number> = {};

    for (const table of tablesToCheck) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (error && !error.message.includes('relation "public.' + table + '" does not exist')) {
        throw error;
      }

      // Get column count for the table
      const { data: columns, error: colError } = await supabase
        .rpc('get_table_columns', { table_name: table });

      tableInfo[table] = columns ? (columns as any[]).length : 0;
    }

    return { success: true, tables: tableInfo };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function runMigration(): Promise<MigrationResult> {
  const migrationFile = path.join(__dirname, 'migrations', 'apply_migration.sql');
  
  if (!fs.existsSync(migrationFile)) {
    return { success: false, error: `Migration file not found: ${migrationFile}` };
  }

  const migrationSQL = fs.readFileSync(migrationFile, 'utf-8');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return {
      success: false,
      error: 'Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Execute the migration SQL
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // Try alternative approach - execute as raw query
      const { error: rawError } = await supabase.from('_temp_migration' as any).select('*');
      
      // The RPC approach might not work, so we suggest manual execution
      console.log('\n⚠️  Automatic migration execution is not supported.');
      console.log('Please run the following SQL in your Supabase SQL Editor:\n');
      console.log('='.repeat(60));
      console.log(migrationSQL);
      console.log('='.repeat(60) + '\n');
      
      return { success: false, error: 'Manual migration required - see SQL above' };
    }

    return await verifySchema();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔍 Supabase Migration Helper\n');
  console.log('='.repeat(60));

  // Verify current schema
  console.log('\n📋 Current Schema Status:');
  const verifyResult = await verifySchema();
  
  if (verifyResult.success && verifyResult.tables) {
    console.log('✅ Tables found:');
    for (const [table, columns] of Object.entries(verifyResult.tables)) {
      console.log(`   - ${table}: ${columns} columns`);
    }
  } else {
    console.log('❌ Schema verification failed:', verifyResult.error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📝 To apply migrations:');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and run the SQL from: supabase/migrations/apply_migration.sql');
  console.log('4. Or use the Supabase CLI: npx supabase db push\n');
}

// Export for use in other scripts
export { verifySchema, runMigration };

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

