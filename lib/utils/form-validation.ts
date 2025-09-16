export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export interface ProductFormData {
  name: string;
  category: string;
  sku: string;
  price: string;
  status: string;
  description: string;
  tags: string[];
  thumbnail_url: string;
  primary_image_url: string;
  back_image_url: string;
  has_back_printing: boolean;
  additional_images: string[];
  horizontal_enabled: boolean;
  vertical_enabled: boolean;
  all_over_enabled: boolean;
}

/**
 * Validation rules for product form
 */
export const PRODUCT_VALIDATION_RULES: Record<keyof ProductFormData, ValidationRule> = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 200,
  },
  category: {
    required: true,
    custom: (value) => {
      const validCategories = [
        'apparel',
        'bags',
        'drinkware',
        'electronics',
        'office',
        'outdoor',
        'wellness',
        'other',
      ];
      return validCategories.includes(value) ? null : 'Please select a valid category';
    },
  },
  sku: {
    maxLength: 50,
    pattern: /^[A-Za-z0-9-]*$/,
    custom: (value) => {
      if (!value) return null; // SKU is optional
      if (value.startsWith('-') || value.endsWith('-')) {
        return 'SKU cannot start or end with a hyphen';
      }
      if (value.includes('--')) {
        return 'SKU cannot contain consecutive hyphens';
      }
      return null;
    },
  },
  price: {
    custom: (value) => {
      if (!value) return null; // Price is optional
      const num = parseFloat(value);
      if (isNaN(num)) return 'Price must be a valid number';
      if (num < 0) return 'Price cannot be negative';
      if (num > 999999.99) return 'Price cannot exceed $999,999.99';
      return null;
    },
  },
  status: {
    required: true,
    custom: (value) => {
      const validStatuses = ['active', 'inactive'];
      return validStatuses.includes(value) ? null : 'Please select a valid status';
    },
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 5000,
    custom: (value) => {
      if (!value) return null;
      // Strip HTML tags and check length
      const textOnly = value.replace(/<[^>]*>/g, '').trim();
      if (textOnly.length < 10)
        return 'Description must be at least 10 characters (excluding HTML)';
      if (textOnly.length > 5000)
        return 'Description cannot exceed 5000 characters (excluding HTML)';
      return null;
    },
  },
  tags: {
    custom: (value: string[]) => {
      if (!Array.isArray(value)) return 'Tags must be an array';
      if (value.length > 10) return 'Maximum 10 tags allowed';

      for (const tag of value) {
        if (typeof tag !== 'string') return 'All tags must be strings';
        if (tag.length > 50) return 'Each tag must be 50 characters or less';
        if (tag.trim().length === 0) return 'Tags cannot be empty';
      }

      // Check for duplicates
      const uniqueTags = new Set(value);
      if (uniqueTags.size !== value.length) return 'Duplicate tags are not allowed';

      return null;
    },
  },
  thumbnail_url: {
    custom: (value) => {
      if (!value) return null; // Optional field
      return validateImageUrl(value);
    },
  },
  primary_image_url: {
    custom: (value) => {
      if (!value) return null; // Optional field
      return validateImageUrl(value);
    },
  },
  additional_images: {
    custom: (value: string[]) => {
      if (!Array.isArray(value)) return 'Additional images must be an array';
      if (value.length > 5) return 'Maximum 5 additional images allowed';

      for (const url of value) {
        if (typeof url !== 'string') return 'All image URLs must be strings';
        const urlError = validateImageUrl(url);
        if (urlError) return urlError;
      }

      return null;
    },
  },
  back_image_url: {
    custom: (value) => {
      if (!value) return null; // Optional field
      return validateImageUrl(value);
    },
  },
  has_back_printing: {
    custom: (value) => {
      if (typeof value !== 'boolean') return 'Has back printing must be a boolean';
      return null;
    },
  },
  horizontal_enabled: {
    custom: (value) => {
      if (typeof value !== 'boolean') return 'Horizontal enabled must be a boolean';
      return null;
    },
  },
  vertical_enabled: {
    custom: (value) => {
      if (typeof value !== 'boolean') return 'Vertical enabled must be a boolean';
      return null;
    },
  },
  all_over_enabled: {
    custom: (value) => {
      if (typeof value !== 'boolean') return 'All over enabled must be a boolean';
      return null;
    },
  },
};

/**
 * Validate a single field
 */
export function validateField(
  fieldName: keyof ProductFormData,
  value: any,
  rules: ValidationRule = PRODUCT_VALIDATION_RULES[fieldName]
): string[] {
  const errors: string[] = [];

  // Check required
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    errors.push(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`);
    return errors; // Return early for required fields
  }

  // Skip other validations if field is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return errors;
  }

  // Check minimum length
  if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
    errors.push(
      `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${rules.minLength} characters`
    );
  }

  // Check maximum length
  if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
    errors.push(
      `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must not exceed ${rules.maxLength} characters`
    );
  }

  // Check pattern
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    errors.push(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} has invalid format`);
  }

  // Check custom validation
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      errors.push(customError);
    }
  }

  return errors;
}

/**
 * Validate entire product form
 */
export function validateProductForm(data: ProductFormData): ValidationResult {
  const errors: Record<string, string[]> = {};
  let isValid = true;

  // Validate each field
  Object.keys(PRODUCT_VALIDATION_RULES).forEach((fieldName) => {
    const key = fieldName as keyof ProductFormData;
    const fieldErrors = validateField(key, data[key]);

    if (fieldErrors.length > 0) {
      errors[key] = fieldErrors;
      isValid = false;
    }
  });

  return { isValid, errors };
}

/**
 * Get validation status for a step
 */
export function getStepValidation(stepIndex: number, data: ProductFormData): boolean {
  switch (stepIndex) {
    case 0: // Basic Info Step
      const basicFields = ['name', 'category'] as const;
      return basicFields.every((field) => {
        const fieldErrors = validateField(field, data[field]);
        return fieldErrors.length === 0;
      });

    case 1: // Description Step
      const descriptionErrors = validateField('description', data.description);
      return descriptionErrors.length === 0;

    case 2: // Tags Step
      const tagErrors = validateField('tags', data.tags);
      return tagErrors.length === 0;

    case 3: // Images Step
      // Images are optional, so always valid
      return true;

    default:
      return true;
  }
}

/**
 * Validate image URL
 */
function validateImageUrl(url: string): string | null {
  if (!url.trim()) return null;

  try {
    const urlObj = new URL(url);

    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return 'Image URL must use HTTP or HTTPS protocol';
    }

    // Check file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = validExtensions.some((ext) =>
      urlObj.pathname.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      return 'Image URL must end with a valid image extension (.jpg, .png, .gif, .webp)';
    }

    return null;
  } catch (error) {
    return 'Please enter a valid URL';
  }
}
