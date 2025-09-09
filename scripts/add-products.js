const products = [
  {
    name: 'Wireless Charging Pad',
    description:
      'Premium wireless charging pad with LED indicator and fast charging support for all Qi-enabled devices',
    sku: 'TECH-001',
    category: 'electronics',
    price: 34.99,
    status: 'active',
    tags: ['wireless', 'charging', 'tech', 'gift'],
    thumbnail_url: 'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=800',
    additional_images: [],
  },
  {
    name: 'Leather Portfolio',
    description: 'Executive leather portfolio with document organizer and built-in calculator',
    sku: 'PORT-001',
    category: 'office',
    price: 89.99,
    status: 'active',
    tags: ['leather', 'portfolio', 'executive', 'professional'],
    thumbnail_url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800',
    additional_images: [],
  },
  {
    name: 'Bamboo Water Bottle',
    description: 'Eco-friendly bamboo water bottle with temperature retention up to 24 hours',
    sku: 'BOT-001',
    category: 'drinkware',
    price: 28.99,
    status: 'active',
    tags: ['bamboo', 'eco', 'bottle', 'sustainable'],
    thumbnail_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800',
    additional_images: [],
  },
  {
    name: 'USB Flash Drive Set',
    description: 'Premium metal USB 3.0 flash drive set with custom engraving options',
    sku: 'USB-001',
    category: 'electronics',
    price: 45.99,
    status: 'active',
    tags: ['usb', 'storage', 'tech', 'engraving'],
    thumbnail_url: 'https://images.unsplash.com/photo-1597484661973-ee6cd0b6482c?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1597484661973-ee6cd0b6482c?w=800',
    additional_images: [],
  },
  {
    name: 'Canvas Messenger Bag',
    description: 'Durable canvas messenger bag with laptop compartment and adjustable strap',
    sku: 'BAG-001',
    category: 'bags',
    price: 67.99,
    status: 'active',
    tags: ['canvas', 'messenger', 'laptop', 'professional'],
    thumbnail_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
    additional_images: [],
  },
  {
    name: 'Travel Tumbler',
    description: 'Stainless steel travel tumbler with spill-proof lid and heat retention',
    sku: 'TUM-001',
    category: 'drinkware',
    price: 22.99,
    status: 'active',
    tags: ['tumbler', 'travel', 'stainless', 'insulated'],
    thumbnail_url: 'https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=800',
    additional_images: [],
  },
  {
    name: 'Desktop Organizer',
    description: 'Wooden desktop organizer with phone stand and multiple compartments',
    sku: 'DESK-001',
    category: 'office',
    price: 38.99,
    status: 'active',
    tags: ['wood', 'organizer', 'desktop', 'office'],
    thumbnail_url: 'https://images.unsplash.com/photo-1555982105-d25af4182e4e?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1555982105-d25af4182e4e?w=800',
    additional_images: [],
  },
  {
    name: 'Bluetooth Speaker',
    description: 'Portable waterproof Bluetooth speaker with 360-degree sound',
    sku: 'SPEAK-001',
    category: 'electronics',
    price: 56.99,
    status: 'active',
    tags: ['bluetooth', 'speaker', 'waterproof', 'portable'],
    thumbnail_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',
    additional_images: [],
  },
  {
    name: 'Recycled Notebook Set',
    description: 'Set of eco-friendly notebooks made from recycled paper with hardcover binding',
    sku: 'NOTE-001',
    category: 'office',
    price: 24.99,
    status: 'active',
    tags: ['recycled', 'notebook', 'eco', 'sustainable'],
    thumbnail_url: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800',
    additional_images: [],
  },
  {
    name: 'Power Bank',
    description: 'High-capacity 20000mAh power bank with dual USB ports and LED display',
    sku: 'POWER-001',
    category: 'electronics',
    price: 42.99,
    status: 'active',
    tags: ['power', 'battery', 'portable', 'charging'],
    thumbnail_url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800',
    additional_images: [],
  },
  {
    name: 'Lunch Box Set',
    description: 'Premium stainless steel lunch box set with separate compartments and cutlery',
    sku: 'LUNCH-001',
    category: 'kitchenware',
    price: 35.99,
    status: 'active',
    tags: ['lunch', 'stainless', 'food', 'container'],
    thumbnail_url: 'https://images.unsplash.com/photo-1584776296018-3b6b0a9b7c7a?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1584776296018-3b6b0a9b7c7a?w=800',
    additional_images: [],
  },
  {
    name: 'Golf Ball Set',
    description: 'Professional golf ball set with custom logo printing options',
    sku: 'GOLF-001',
    category: 'sports',
    price: 48.99,
    status: 'active',
    tags: ['golf', 'sports', 'outdoor', 'gift'],
    thumbnail_url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800',
    additional_images: [],
  },
  {
    name: 'Ceramic Planter Set',
    description: 'Modern ceramic planter set with drainage system and minimalist design',
    sku: 'PLANT-001',
    category: 'decor',
    price: 31.99,
    status: 'active',
    tags: ['ceramic', 'planter', 'decor', 'office'],
    thumbnail_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800',
    additional_images: [],
  },
  {
    name: 'Umbrella',
    description: 'Windproof automatic umbrella with reinforced frame and custom branding area',
    sku: 'UMB-001',
    category: 'accessories',
    price: 26.99,
    status: 'active',
    tags: ['umbrella', 'windproof', 'rain', 'weather'],
    thumbnail_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    additional_images: [],
  },
  {
    name: 'Keychain Multi-tool',
    description: 'Compact stainless steel multi-tool keychain with 5 essential functions',
    sku: 'KEY-001',
    category: 'accessories',
    price: 18.99,
    status: 'active',
    tags: ['keychain', 'tool', 'utility', 'portable'],
    thumbnail_url: 'https://images.unsplash.com/photo-1609205807490-89b8e30fc5f8?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1609205807490-89b8e30fc5f8?w=800',
    additional_images: [],
  },
  {
    name: 'Coaster Set',
    description: 'Premium wooden coaster set with cork backing and custom engraving',
    sku: 'COAST-001',
    category: 'decor',
    price: 21.99,
    status: 'active',
    tags: ['coaster', 'wood', 'home', 'gift'],
    thumbnail_url: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=400',
    primary_image_url: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800',
    additional_images: [],
  },
];

async function addProducts() {
  const baseUrl = 'http://localhost:3000';

  // First, login to get the authentication cookies
  const loginResponse = await fetch(`${baseUrl}/api/admin/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@test.com',
      password: 'NewPassword123!',
    }),
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.status}`);
  }

  // Get cookies from login response
  const cookies = loginResponse.headers.get('set-cookie');

  console.log(`Adding ${products.length} products...`);
  let successCount = 0;
  let errorCount = 0;

  for (const product of products) {
    try {
      const response = await fetch(`${baseUrl}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookies || '',
        },
        body: JSON.stringify(product),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✓ Added: ${product.name} (${product.sku})`);
        successCount++;
      } else {
        const error = await response.json();
        console.log(`✗ Failed to add ${product.name}: ${error.error}`);
        errorCount++;
      }
    } catch (error) {
      console.log(`✗ Error adding ${product.name}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\nSummary: ${successCount} products added successfully, ${errorCount} errors`);
}

addProducts().catch(console.error);
