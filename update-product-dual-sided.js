const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://zemjgjofmefmffwrrufr.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplbWpnam9mbWVmbWZmd3JydWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzMTk2MywiZXhwIjoyMDcyMTA3OTYzfQ.1JvqaxtG_GSuX64_xlVvO21DDwZp1EnEI6_S_YaLGrg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateProductForDualSided() {
  try {
    console.log('Updating product to enable dual-sided printing...');

    // Update the specific product to enable dual-sided printing
    const { data, error } = await supabase
      .from('gift_items')
      .update({
        has_back_printing: true,
      })
      .eq('id', '23d21ac8-c9c8-4626-bbf5-31c09ec5e023')
      .select();

    if (error) {
      console.error('Error updating product:', error);
      return;
    }

    console.log('Product updated successfully:', data);

    // Verify the update
    const { data: product, error: fetchError } = await supabase
      .from('gift_items')
      .select('*')
      .eq('id', '23d21ac8-c9c8-4626-bbf5-31c09ec5e023')
      .single();

    if (fetchError) {
      console.error('Error fetching updated product:', fetchError);
      return;
    }

    console.log('Updated product details:', {
      id: product.id,
      name: product.name,
      has_back_printing: product.has_back_printing,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

updateProductForDualSided();
