const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateConstraint() {
  console.log('🔧 Starting constraint migration...');

  try {
    // First, drop the existing unique constraint
    console.log('📝 Dropping existing unique constraint...');
    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE placement_constraints DROP CONSTRAINT IF EXISTS placement_constraints_item_id_placement_type_key;',
    });

    if (dropError) {
      console.error('❌ Error dropping constraint:', dropError);
      return;
    }

    console.log('✅ Existing constraint dropped successfully');

    // Create the new unique constraint that includes side
    console.log('📝 Creating new unique constraint including side field...');
    const { error: createError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE placement_constraints ADD CONSTRAINT placement_constraints_item_id_placement_type_side_key UNIQUE (item_id, placement_type, side);',
    });

    if (createError) {
      console.error('❌ Error creating new constraint:', createError);
      return;
    }

    console.log('✅ New constraint created successfully');
    console.log(
      '🎉 Migration completed! Now dual-sided products can have separate constraints for front and back sides.'
    );
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateConstraint();
