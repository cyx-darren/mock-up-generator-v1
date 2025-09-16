import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedTestProduct() {
  try {
    // Insert a test product
    const { data: product, error: productError } = await supabase
      .from('gift_items')
      .insert({
        name: 'A4 Canvas Tote Bag',
        description: 'High-quality canvas tote bag perfect for corporate gifts',
        category: 'bags',
        price: 2.5,
        sku: 'CANVAS-001',
        primary_image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
        horizontal_enabled: true,
        vertical_enabled: false,
        all_over_enabled: false,
      })
      .select()
      .single();

    if (productError) {
      console.error('Error inserting product:', productError);
      return;
    }

    console.log('Test product created successfully:', product);
    console.log('\nYou can now test the mockup generator at:');
    console.log(`http://localhost:3000/create-mockup?product=${product.id}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

seedTestProduct();
