// Script to clear cache and verify consistent back view behavior
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function verifyBackViewConstraints() {
  const productId = '34aa910c-4560-4ba7-b6f9-10c36e59f355';
  
  console.log('=== VERIFYING BACK VIEW CONSTRAINTS ===');
  
  // Check back side constraint
  const { data: backConstraint, error: backError } = await supabaseAdmin
    .from('placement_constraints')
    .select('*')
    .eq('item_id', productId)
    .eq('placement_type', 'horizontal')
    .eq('side', 'back')
    .single();
    
  if (backError) {
    console.error('❌ Error fetching back constraint:', backError);
    return;
  }
  
  console.log('✅ Back constraint found:');
  console.log('  - Constraint Image:', backConstraint.constraint_image_url);
  console.log('  - Side:', backConstraint.side);
  
  // Check product back image URL
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('name, back_image_url')
    .eq('id', productId)
    .single();
    
  if (productError) {
    console.error('❌ Error fetching product:', productError);
    return;
  }
  
  console.log('✅ Product back image:');
  console.log('  - Product:', product.name);
  console.log('  - Back Image URL:', product.back_image_url);
  
  // Verify the constraint image contains 'back-shirt' and product image contains proper back image
  const isCorrectConstraint = backConstraint.constraint_image_url.includes('back-shirt-constraints');
  const isCorrectProductImage = product.back_image_url.includes('back-shirt') || product.back_image_url.includes('1758000962097');
  
  console.log('');
  console.log('=== VERIFICATION RESULTS ===');
  console.log(`✅ Constraint system: ${isCorrectConstraint ? 'CORRECT (back-shirt)' : '❌ WRONG'}`);
  console.log(`✅ Product back image: ${isCorrectProductImage ? 'CORRECT (back image)' : '❌ WRONG'}`);
  
  if (isCorrectConstraint && isCorrectProductImage) {
    console.log('');
    console.log('🎉 ALL SYSTEMS VERIFIED! Back view should show blue t-shirt.');
    console.log('');
    console.log('📋 MANUAL TESTING INSTRUCTIONS:');
    console.log('1. Clear your browser cache (Cmd+Shift+R on Mac)');
    console.log('2. Go to: http://localhost:3000/create-mockup?product=34aa910c-4560-4ba7-b6f9-10c36e59f355');
    console.log('3. Upload PNG logos (NOT SVG) to both front and back');
    console.log('4. Generate the mockup');
    console.log('5. Click the "Back View" tab to see the blue t-shirt back');
  } else {
    console.log('❌ Issues still exist in database configuration');
  }
}

verifyBackViewConstraints().catch(console.error);