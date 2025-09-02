import { ProductCSVRow, CSV_HEADERS, REQUIRED_HEADERS, VALID_CATEGORIES, VALID_STATUSES } from './csvTemplate';

export interface ParseResult {
  success: boolean;
  data?: ProductCSVRow[];
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export interface ValidationWarning {
  row: number;
  field: string;
  message: string;
  value?: string;
}

export class CSVParser {
  static async parseCSV(file: File): Promise<ParseResult> {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        return {
          success: false,
          errors: [{
            row: 0,
            field: 'file',
            message: 'CSV file must contain headers and at least one data row'
          }]
        };
      }

      // Parse headers
      const headers = this.parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
      
      // Validate headers
      const headerValidation = this.validateHeaders(headers);
      if (!headerValidation.valid) {
        return {
          success: false,
          errors: headerValidation.errors
        };
      }

      // Parse data rows
      const data: ProductCSVRow[] = [];
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        const row = this.mapToProductRow(headers, values);
        
        // Validate row
        const validation = this.validateRow(row, i + 1);
        
        if (validation.errors.length > 0) {
          errors.push(...validation.errors);
        }
        
        if (validation.warnings.length > 0) {
          warnings.push(...validation.warnings);
        }
        
        // Add row even if it has warnings (but not if it has errors)
        if (validation.errors.length === 0) {
          data.push(row);
        }
      }

      return {
        success: errors.length === 0,
        data: errors.length === 0 ? data : undefined,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          row: 0,
          field: 'file',
          message: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private static validateHeaders(headers: string[]): { valid: boolean; errors?: ValidationError[] } {
    const errors: ValidationError[] = [];
    
    // Check for required headers
    for (const required of REQUIRED_HEADERS) {
      if (!headers.includes(required)) {
        errors.push({
          row: 1,
          field: 'headers',
          message: `Missing required column: ${required}`
        });
      }
    }
    
    // Check for unknown headers
    for (const header of headers) {
      if (header && !CSV_HEADERS.includes(header as any)) {
        errors.push({
          row: 1,
          field: 'headers',
          message: `Unknown column: ${header}. Valid columns are: ${CSV_HEADERS.join(', ')}`
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private static mapToProductRow(headers: string[], values: string[]): ProductCSVRow {
    const row: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      switch (header) {
        case 'name':
        case 'description':
        case 'sku':
        case 'category':
        case 'status':
        case 'thumbnail_url':
        case 'primary_image_url':
          row[header] = value;
          break;
          
        case 'price':
          row.price = value ? parseFloat(value) : undefined;
          break;
          
        case 'tags':
          row.tags = value;
          break;
          
        case 'additional_images':
          row.additional_images = value;
          break;
      }
    });
    
    return row as ProductCSVRow;
  }

  private static validateRow(row: ProductCSVRow, rowNumber: number): { 
    errors: ValidationError[]; 
    warnings: ValidationWarning[] 
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Required fields
    if (!row.name || row.name.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: 'Product name is required'
      });
    }
    
    if (!row.description || row.description.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'description',
        message: 'Product description is required'
      });
    }
    
    if (!row.category || row.category.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'category',
        message: 'Product category is required'
      });
    } else if (!VALID_CATEGORIES.includes(row.category.toLowerCase() as any)) {
      errors.push({
        row: rowNumber,
        field: 'category',
        message: `Invalid category: ${row.category}. Valid categories are: ${VALID_CATEGORIES.join(', ')}`,
        value: row.category
      });
    }
    
    // Validate status if provided
    if (row.status && !VALID_STATUSES.includes(row.status.toLowerCase() as any)) {
      errors.push({
        row: rowNumber,
        field: 'status',
        message: `Invalid status: ${row.status}. Valid statuses are: ${VALID_STATUSES.join(', ')}`,
        value: row.status
      });
    }
    
    // Validate price
    if (row.price !== undefined && (isNaN(row.price) || row.price < 0)) {
      errors.push({
        row: rowNumber,
        field: 'price',
        message: 'Price must be a positive number',
        value: String(row.price)
      });
    }
    
    // Validate URLs
    const urlFields = ['thumbnail_url', 'primary_image_url'] as const;
    for (const field of urlFields) {
      if (row[field] && !this.isValidUrl(row[field]!)) {
        warnings.push({
          row: rowNumber,
          field,
          message: `Invalid URL format for ${field}`,
          value: row[field]
        });
      }
    }
    
    // Validate additional images URLs
    if (row.additional_images) {
      const urls = row.additional_images.split(';');
      for (const url of urls) {
        if (url.trim() && !this.isValidUrl(url.trim())) {
          warnings.push({
            row: rowNumber,
            field: 'additional_images',
            message: `Invalid URL in additional images: ${url}`,
            value: url
          });
        }
      }
    }
    
    // Check for SKU uniqueness will be done at import time
    if (!row.sku) {
      warnings.push({
        row: rowNumber,
        field: 'sku',
        message: 'SKU not provided, will be auto-generated'
      });
    }
    
    return { errors, warnings };
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      // Also accept relative URLs starting with /
      return url.startsWith('/');
    }
  }
}