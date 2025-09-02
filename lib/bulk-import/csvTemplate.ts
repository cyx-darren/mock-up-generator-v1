export interface ProductCSVRow {
  name: string;
  description: string;
  sku?: string;
  category: string;
  price?: number;
  status?: 'active' | 'inactive' | 'draft';
  tags?: string;
  thumbnail_url?: string;
  primary_image_url?: string;
  additional_images?: string;
}

export const CSV_HEADERS = [
  'name',
  'description', 
  'sku',
  'category',
  'price',
  'status',
  'tags',
  'thumbnail_url',
  'primary_image_url',
  'additional_images'
] as const;

export const REQUIRED_HEADERS = ['name', 'description', 'category'] as const;

export const VALID_CATEGORIES = [
  'apparel',
  'bags', 
  'drinkware',
  'electronics',
  'office',
  'outdoor',
  'wellness',
  'other'
] as const;

export const VALID_STATUSES = ['active', 'inactive', 'draft'] as const;

export function generateCSVTemplate(): string {
  const headers = CSV_HEADERS.join(',');
  
  const sampleRows = [
    [
      'Premium Coffee Mug',
      'High-quality ceramic coffee mug with heat retention technology',
      'MUG-001',
      'drinkware',
      '19.99',
      'active',
      'coffee;ceramic;gift',
      'https://example.com/mug-thumb.jpg',
      'https://example.com/mug-main.jpg',
      'https://example.com/mug-1.jpg;https://example.com/mug-2.jpg'
    ],
    [
      'Executive Pen Set',
      'Luxury pen set with engraving options for corporate gifting',
      'PEN-002',
      'office',
      '45.99',
      'active',
      'pen;executive;engraving',
      'https://example.com/pen-thumb.jpg',
      'https://example.com/pen-main.jpg',
      ''
    ],
    [
      'Eco-Friendly Tote Bag',
      'Sustainable canvas tote bag made from recycled materials',
      '',
      'bags',
      '12.50',
      'draft',
      'eco-friendly;tote;canvas;sustainable',
      '',
      '',
      ''
    ]
  ];

  const csvContent = [
    headers,
    ...sampleRows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

export function downloadCSVTemplate(): void {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'product_import_template.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}