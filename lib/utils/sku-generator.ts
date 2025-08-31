export interface SkuGenerationOptions {
  name: string;
  category: string;
  customPrefix?: string;
  includeYear?: boolean;
  includeRandom?: boolean;
  length?: number;
}

/**
 * Generate a SKU based on product information
 */
export function generateSku({
  name,
  category,
  customPrefix,
  includeYear = true,
  includeRandom = true,
  length = 8,
}: SkuGenerationOptions): string {
  const parts: string[] = [];

  // Use custom prefix or generate from category
  if (customPrefix) {
    parts.push(customPrefix.toUpperCase());
  } else {
    const categoryPrefix = getCategoryPrefix(category);
    parts.push(categoryPrefix);
  }

  // Add name component (first 3 letters of first word)
  const nameComponent = name
    .split(' ')[0]
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 3);
  
  if (nameComponent.length > 0) {
    parts.push(nameComponent);
  }

  // Add year component
  if (includeYear) {
    const currentYear = new Date().getFullYear();
    parts.push(currentYear.toString().slice(-2));
  }

  // Add random component for uniqueness
  if (includeRandom) {
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    parts.push(randomNum);
  }

  let sku = parts.join('-');

  // Ensure minimum length
  if (sku.length < length) {
    const additionalRandom = Math.floor(Math.random() * Math.pow(10, length - sku.length))
      .toString()
      .padStart(length - sku.length, '0');
    sku += additionalRandom;
  }

  return sku.toUpperCase();
}

/**
 * Get category prefix mapping
 */
function getCategoryPrefix(category: string): string {
  const prefixMap: Record<string, string> = {
    apparel: 'APP',
    bags: 'BAG',
    drinkware: 'DRK',
    electronics: 'ELE',
    office: 'OFF',
    outdoor: 'OUT',
    wellness: 'WEL',
    other: 'OTH',
  };

  return prefixMap[category.toLowerCase()] || 'PRD';
}

/**
 * Validate SKU format
 */
export function validateSku(sku: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check minimum length
  if (sku.length < 3) {
    errors.push('SKU must be at least 3 characters long');
  }

  // Check maximum length
  if (sku.length > 50) {
    errors.push('SKU must not exceed 50 characters');
  }

  // Check valid characters (letters, numbers, hyphens)
  if (!/^[A-Za-z0-9-]+$/.test(sku)) {
    errors.push('SKU can only contain letters, numbers, and hyphens');
  }

  // Check it doesn't start or end with hyphen
  if (sku.startsWith('-') || sku.endsWith('-')) {
    errors.push('SKU cannot start or end with a hyphen');
  }

  // Check for consecutive hyphens
  if (sku.includes('--')) {
    errors.push('SKU cannot contain consecutive hyphens');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate multiple SKU suggestions
 */
export function generateSkuSuggestions(options: SkuGenerationOptions): string[] {
  const suggestions: string[] = [];

  // Generate variations
  suggestions.push(generateSku(options));
  suggestions.push(generateSku({ ...options, includeYear: false }));
  suggestions.push(generateSku({ ...options, includeRandom: false }));
  suggestions.push(generateSku({ ...options, customPrefix: options.category.toUpperCase().slice(0, 2) }));
  
  // Add timestamp-based version
  const timestamp = Date.now().toString().slice(-6);
  suggestions.push(generateSku({ ...options, includeRandom: false }) + timestamp);

  // Remove duplicates and return unique suggestions
  return [...new Set(suggestions)];
}