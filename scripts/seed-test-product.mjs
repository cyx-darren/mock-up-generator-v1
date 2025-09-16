import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedTestProduct() {
  try {
    // First, get or create an admin user
    const { data: adminUsers } = await supabase.from('admin_users').select('id').limit(1);

    let adminUserId;
    if (adminUsers && adminUsers.length > 0) {
      adminUserId = adminUsers[0].id;
    } else {
      // Create a test admin user
      const { data: newAdmin, error: adminError } = await supabase
        .from('admin_users')
        .insert({
          email: 'test@example.com',
          name: 'Test Admin',
          role: 'admin',
        })
        .select()
        .single();

      if (adminError) {
        console.error('Error creating admin user:', adminError);
        return;
      }
      adminUserId = newAdmin.id;
    }

    // Insert a test product with all required fields
    const { data: product, error: productError } = await supabase
      .from('gift_items')
      .insert({
        name: 'A4 Canvas Tote Bag',
        description: 'High-quality canvas tote bag perfect for corporate gifts',
        category: 'bags',
        sku: 'CANVAS-001',
        base_image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
        thumbnail_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
        horizontal_enabled: true,
        vertical_enabled: false,
        all_over_enabled: false,
        is_active: true,
        status: 'active',
        created_by: adminUserId,
        tags: ['bags', 'canvas', 'eco-friendly'],
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
