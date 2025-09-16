const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function debugConstraints() {
  const productId = '34aa910c-4560-4ba7-b6f9-10c36e59f355';
  
  console.log('=== CHECKING CONSTRAINTS FOR PREMIUM ROUNDNECK TEE ===');
  
  const { data: constraints, error } = await supabaseAdmin
    .from('placement_constraints')
    .select('*')
    .eq('item_id', productId)
    .order('side', { ascending: true });
    
  if (error) {
    console.error('Error fetching constraints:', error);
    return;
  }
  
  console.log('Found constraints:');
  constraints.forEach(constraint => {
    console.log(`- Side: ${constraint.side}, Type: ${constraint.placement_type}`);
    console.log(`  Constraint Image: ${constraint.constraint_image_url}`);
    console.log(`  Created: ${constraint.created_at}`);
    console.log('');
  });
  
  // Check if there are back side constraints
  const backConstraints = constraints.filter(c => c.side === 'back');
  if (backConstraints.length === 0) {
    console.log('❌ NO BACK SIDE CONSTRAINTS FOUND!');
    console.log('This explains why canvas bag constraints are being used as fallback.');
  } else {
    console.log('✅ Back side constraints found:', backConstraints.length);
  }
}

debugConstraints().catch(console.error);