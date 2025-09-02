import JSZip from 'jszip';

export interface ExtractedFile {
  name: string;
  originalName: string;
  data: Buffer;
  size: number;
  type: string;
}

export interface ProcessingResult {
  success: boolean;
  extracted: ExtractedFile[];
  errors: string[];
  skipped: string[];
}

export class ZipProcessor {
  private static readonly SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];

  private static readonly SUPPORTED_EXTENSIONS = [
    '.jpg',
    '.jpeg', 
    '.png',
    '.webp',
    '.gif'
  ];

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
  private static readonly MAX_FILES = 50; // Maximum files in ZIP

  static async extractImages(zipFile: File): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      success: true,
      extracted: [],
      errors: [],
      skipped: []
    };

    try {
      // Load and validate ZIP file
      const zip = await JSZip.loadAsync(zipFile);
      
      const filePromises: Promise<void>[] = [];
      let fileCount = 0;

      // Process each file in the ZIP
      zip.forEach((relativePath, file) => {
        fileCount++;
        
        // Skip if too many files
        if (fileCount > this.MAX_FILES) {
          result.skipped.push(`${relativePath}: Too many files in ZIP (max ${this.MAX_FILES})`);
          return;
        }

        // Skip directories
        if (file.dir) {
          return;
        }

        const processFile = async () => {
          try {
            // Check file extension
            const extension = this.getFileExtension(relativePath).toLowerCase();
            if (!this.SUPPORTED_EXTENSIONS.includes(extension)) {
              result.skipped.push(`${relativePath}: Unsupported file type`);
              return;
            }

            // Get file data
            const data = await file.async('nodebuffer');
            
            // Check file size
            if (data.length > this.MAX_FILE_SIZE) {
              result.errors.push(`${relativePath}: File too large (max ${this.MAX_FILE_SIZE / 1024 / 1024}MB)`);
              return;
            }

            // Check if it's actually an image by reading file signature
            const mimeType = this.getMimeTypeFromBuffer(data);
            if (!mimeType || !this.SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
              result.errors.push(`${relativePath}: Invalid image file`);
              return;
            }

            // Extract file successfully
            result.extracted.push({
              name: this.sanitizeFilename(relativePath),
              originalName: relativePath,
              data,
              size: data.length,
              type: mimeType
            });

          } catch (error) {
            result.errors.push(`${relativePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        };

        filePromises.push(processFile());
      });

      // Wait for all files to be processed
      await Promise.all(filePromises);

      // Update success status
      result.success = result.errors.length === 0 && result.extracted.length > 0;

      if (result.extracted.length === 0) {
        result.errors.push('No valid image files found in ZIP');
        result.success = false;
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Failed to process ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot);
  }

  private static sanitizeFilename(filename: string): string {
    // Remove directory path and keep only filename
    const name = filename.split('/').pop() || filename;
    
    // Remove special characters but keep alphanumeric, dots, dashes, underscores
    return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  }

  private static getMimeTypeFromBuffer(buffer: Buffer): string | null {
    // Check file signatures (magic numbers)
    if (buffer.length < 4) return null;

    const bytes = buffer.subarray(0, 12);

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return 'image/png';
    }

    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return 'image/jpeg';
    }

    // WebP: RIFF .... WEBP
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return 'image/webp';
    }

    // GIF: GIF87a or GIF89a
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return 'image/gif';
    }

    return null;
  }

  static matchFilesToProducts(files: ExtractedFile[], products: any[]): Map<string, ExtractedFile[]> {
    const matches = new Map<string, ExtractedFile[]>();

    // Initialize map with product SKUs
    products.forEach(product => {
      matches.set(product.sku, []);
    });

    // Try to match files to products
    files.forEach(file => {
      const filename = file.name.toLowerCase();
      let matched = false;

      // Try exact SKU match first
      for (const product of products) {
        const sku = product.sku.toLowerCase();
        
        // Check if filename contains SKU
        if (filename.includes(sku)) {
          const existing = matches.get(product.sku) || [];
          existing.push(file);
          matches.set(product.sku, existing);
          matched = true;
          break;
        }
      }

      // If no exact match, try partial matches
      if (!matched) {
        for (const product of products) {
          const productName = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          const fileNameClean = filename.replace(/[^a-z0-9]/g, '');
          
          // Check if filename contains product name (partial match)
          if (fileNameClean.includes(productName) || productName.includes(fileNameClean)) {
            const existing = matches.get(product.sku) || [];
            existing.push(file);
            matches.set(product.sku, existing);
            matched = true;
            break;
          }
        }
      }

      // Store unmatched files under special key
      if (!matched) {
        const unmatched = matches.get('__unmatched__') || [];
        unmatched.push(file);
        matches.set('__unmatched__', unmatched);
      }
    });

    return matches;
  }
}