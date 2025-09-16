const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = 'https://zemjgjofmefmffwrrufr.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplbWpnam9mbWVmbWZmd3JydWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzMTk2MywiZXhwIjoyMDcyMTA3OTYzfQ.1JvqaxtG_GSuX64_xlVvO21DDwZp1EnEI6_S_YaLGrg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running dual-sided printing migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'dual-sided-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration SQL...');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL,
    });

    if (error) {
      console.error('Error running migration:', error);

      // Try alternative approach - split and run individual statements
      console.log('Trying alternative approach - running statements individually...');
      const statements = migrationSQL
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt && !stmt.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql: statement,
          });

          if (stmtError) {
            console.error(`Error in statement ${i + 1}:`, stmtError);
            console.error('Statement:', statement);
          } else {
            console.log(`Statement ${i + 1} executed successfully`);
          }
        }
      }

      return;
    }

    console.log('Migration completed successfully!');

    // Verify the changes
    console.log('Verifying changes...');
    const { data: product, error: fetchError } = await supabase
      .from('gift_items')
      .select(
        'id, name, has_back_printing, back_image_url, horizontal_enabled, vertical_enabled, all_over_enabled'
      )
      .eq('id', '23d21ac8-c9c8-4626-bbf5-31c09ec5e023')
      .single();

    if (fetchError) {
      console.error('Error verifying changes:', fetchError);
      return;
    }

    console.log('Updated product details:', product);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

runMigration();
