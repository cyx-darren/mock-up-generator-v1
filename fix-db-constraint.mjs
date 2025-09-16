import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixConstraint() {
  console.log('🔧 Fixing database constraint for dual-sided products...');

  try {
    // Drop existing constraint using raw SQL
    console.log('📝 Dropping existing unique constraint...');

    const { data: dropResult, error: dropError } = await supabase.rpc('execute', {
      query:
        'ALTER TABLE placement_constraints DROP CONSTRAINT IF EXISTS placement_constraints_item_id_placement_type_key',
    });

    if (dropError) {
      console.log('⚠️  Note: Could not drop constraint via RPC:', dropError.message);
      console.log("📝 This might be because the constraint doesn't exist or RPC is not available");
    } else {
      console.log('✅ Existing constraint dropped successfully');
    }

    // Add new constraint
    console.log('📝 Creating new unique constraint including side field...');

    const { data: createResult, error: createError } = await supabase.rpc('execute', {
      query:
        'ALTER TABLE placement_constraints ADD CONSTRAINT placement_constraints_item_id_placement_type_side_key UNIQUE (item_id, placement_type, side)',
    });

    if (createError) {
      console.log('⚠️  Could not create constraint via RPC:', createError.message);
      console.log('📋 Manual SQL needed:');
      console.log(
        'ALTER TABLE placement_constraints DROP CONSTRAINT IF EXISTS placement_constraints_item_id_placement_type_key;'
      );
      console.log(
        'ALTER TABLE placement_constraints ADD CONSTRAINT placement_constraints_item_id_placement_type_side_key UNIQUE (item_id, placement_type, side);'
      );
    } else {
      console.log('✅ New constraint created successfully');
      console.log('🎉 Migration completed!');
    }
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.log('📋 Please run this SQL manually in Supabase dashboard:');
    console.log(
      'ALTER TABLE placement_constraints DROP CONSTRAINT IF EXISTS placement_constraints_item_id_placement_type_key;'
    );
    console.log(
      'ALTER TABLE placement_constraints ADD CONSTRAINT placement_constraints_item_id_placement_type_side_key UNIQUE (item_id, placement_type, side);'
    );
  }
}

fixConstraint();
