const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabaseUrl = 'https://zemjgjofmefmffwrrufr.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplbWpnam9mbWVmbWZmd3JydWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzMTk2MywiZXhwIjoyMDcyMTA3OTYzfQ.1JvqaxtG_GSuX64_xlVvO21DDwZp1EnEI6_S_YaLGrg';

async function enableDualSidedPrinting() {
  try {
    console.log('Attempting to update product directly...');

    // Create supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, let's check if the columns exist by trying to fetch the product
    const { data: productCheck, error: checkError } = await supabase
      .from('gift_items')
      .select('id, name, description, has_back_printing')
      .eq('id', '23d21ac8-c9c8-4626-bbf5-31c09ec5e023')
      .single();

    if (checkError) {
      console.log('Column does not exist yet, which is expected. Error:', checkError.message);
    } else {
      console.log('Product found with has_back_printing column:', productCheck);
    }

    // If we need to add the columns, we'll do it manually through the Supabase dashboard
    // For now, let's just confirm our frontend works by manually updating via the web interface

    console.log('\nTo complete the dual-sided setup:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Navigate to your project > SQL Editor');
    console.log('3. Run the migration from supabase/dual-sided-migration.sql');
    console.log('4. Or manually add the columns via the Table Editor');

    // Alternative: Let's create a test record that simulates dual-sided
    console.log("\nFor immediate testing, let's check what columns exist...");

    const { data: allColumns, error: columnsError } = await supabase
      .from('gift_items')
      .select('*')
      .limit(1);

    if (allColumns && allColumns[0]) {
      console.log('Existing columns:', Object.keys(allColumns[0]));
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

enableDualSidedPrinting();
