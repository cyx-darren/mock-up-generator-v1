import { NextRequest, NextResponse } from 'next/server';
import { deflate, gzip, brotliCompress } from 'zlib';
import { promisify } from 'util';

const deflateAsync = promisify(deflate);
const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);

interface CompressionOptions {
  threshold?: number; // Minimum response size to compress (bytes)
  level?: number; // Compression level (1-9)
  excludeTypes?: string[]; // MIME types to exclude from compression
  includeTypes?: string[]; // MIME types to include (if specified, only these will be compressed)
  brotliQuality?: number; // Brotli quality (0-11)
}

class CompressionManager {
  private static instance: CompressionManager;
  private defaultOptions: Required<CompressionOptions>;

  constructor(options: CompressionOptions = {}) {
    this.defaultOptions = {
      threshold: 1024, // 1KB minimum
      level: 6, // Balanced compression level
      excludeTypes: [
        'image/',
        'video/',
        'audio/',
        'application/zip',
        'application/gzip',
        'application/x-brotli'
      ],
      includeTypes: [],
      brotliQuality: 6
    };

    Object.assign(this.defaultOptions, options);
  }

  static getInstance(options?: CompressionOptions): CompressionManager {
    if (!CompressionManager.instance) {
      CompressionManager.instance = new CompressionManager(options);
    }
    return CompressionManager.instance;
  }

  shouldCompress(
    contentType: string | null,
    contentLength: number,
    options: CompressionOptions = {}
  ): boolean {
    const opts = { ...this.defaultOptions, ...options };

    // Check minimum size threshold
    if (contentLength < opts.threshold) {
      return false;
    }

    if (!contentType) {
      return false;
    }

    // Check include list (if specified, only compress these types)
    if (opts.includeTypes.length > 0) {
      return opts.includeTypes.some(type => contentType.startsWith(type));
    }

    // Check exclude list
    if (opts.excludeTypes.some(type => contentType.startsWith(type))) {
      return false;
    }

    // Default: compress text-based content
    return contentType.startsWith('text/') ||
           contentType.startsWith('application/json') ||
           contentType.startsWith('application/javascript') ||
           contentType.startsWith('application/xml') ||
           contentType.includes('svg');
  }

  getBestEncoding(acceptEncoding: string | null): 'br' | 'gzip' | 'deflate' | null {
    if (!acceptEncoding) return null;

    const encodings = acceptEncoding.toLowerCase();
    
    // Prefer Brotli for modern browsers
    if (encodings.includes('br')) {
      return 'br';
    }
    
    // Fallback to gzip
    if (encodings.includes('gzip')) {
      return 'gzip';
    }
    
    // Last resort: deflate
    if (encodings.includes('deflate')) {
      return 'deflate';
    }

    return null;
  }

  async compressBuffer(
    buffer: Buffer,
    encoding: 'br' | 'gzip' | 'deflate',
    options: CompressionOptions = {}
  ): Promise<Buffer> {
    const opts = { ...this.defaultOptions, ...options };

    switch (encoding) {
      case 'br':
        return await brotliAsync(buffer, {
          params: {
            [require('zlib').constants.BROTLI_PARAM_QUALITY]: opts.brotliQuality,
            [require('zlib').constants.BROTLI_PARAM_SIZE_HINT]: buffer.length
          }
        });
      
      case 'gzip':
        return await gzipAsync(buffer, {
          level: opts.level,
          windowBits: 15,
          memLevel: 8
        });
      
      case 'deflate':
        return await deflateAsync(buffer, {
          level: opts.level,
          windowBits: 15,
          memLevel: 8
        });
      
      default:
        return buffer;
    }
  }

  async compressResponse(
    response: NextResponse,
    acceptEncoding: string | null,
    options: CompressionOptions = {}
  ): Promise<NextResponse> {
    try {
      const contentType = response.headers.get('content-type');
      const contentLength = parseInt(response.headers.get('content-length') || '0');

      // Check if we should compress
      if (!this.shouldCompress(contentType, contentLength, options)) {
        return response;
      }

      // Get best encoding
      const encoding = this.getBestEncoding(acceptEncoding);
      if (!encoding) {
        return response;
      }

      // Get response body
      const originalBody = await response.arrayBuffer();
      const buffer = Buffer.from(originalBody);

      // Compress the buffer
      const compressedBuffer = await this.compressBuffer(buffer, encoding, options);

      // Calculate compression ratio
      const compressionRatio = ((buffer.length - compressedBuffer.length) / buffer.length) * 100;

      // Only use compression if we achieved meaningful reduction (>5%)
      if (compressionRatio < 5) {
        return response;
      }

      // Create new response with compressed content
      const compressedResponse = new NextResponse(compressedBuffer, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Content-Encoding': encoding,
          'Content-Length': compressedBuffer.length.toString(),
          'Vary': response.headers.get('vary') 
            ? `${response.headers.get('vary')}, Accept-Encoding`
            : 'Accept-Encoding',
          'X-Compression-Ratio': `${compressionRatio.toFixed(1)}%`,
          'X-Original-Size': buffer.length.toString(),
          'X-Compressed-Size': compressedBuffer.length.toString()
        }
      });

      return compressedResponse;
    } catch (error) {
      console.warn('Compression failed:', error);
      return response;
    }
  }

  getCompressionStats(): {
    supported: string[];
    defaultLevel: number;
    threshold: number;
  } {
    return {
      supported: ['br', 'gzip', 'deflate'],
      defaultLevel: this.defaultOptions.level,
      threshold: this.defaultOptions.threshold
    };
  }
}

// Compression middleware wrapper
export function withCompression(options: CompressionOptions = {}) {
  return function compressionMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async function compressedHandler(request: NextRequest): Promise<NextResponse> {
      const response = await handler(request);
      
      // Skip compression for certain status codes
      if (response.status < 200 || response.status >= 300) {
        return response;
      }

      const compression = CompressionManager.getInstance();
      const acceptEncoding = request.headers.get('accept-encoding');

      return await compression.compressResponse(response, acceptEncoding, options);
    };
  };
}

// Pre-configured compression presets
export const CompressionPresets = {
  // High compression for static assets
  static: {
    level: 9,
    brotliQuality: 11,
    threshold: 512,
    includeTypes: ['text/', 'application/javascript', 'application/json']
  } as CompressionOptions,

  // Balanced compression for API responses
  api: {
    level: 6,
    brotliQuality: 6,
    threshold: 1024,
    includeTypes: ['application/json', 'text/']
  } as CompressionOptions,

  // Light compression for real-time content
  realtime: {
    level: 1,
    brotliQuality: 1,
    threshold: 2048,
    includeTypes: ['application/json']
  } as CompressionOptions,

  // No compression
  none: {
    threshold: Infinity
  } as CompressionOptions
};

// Utility function for manual compression
export async function compressData(
  data: string | Buffer,
  encoding: 'br' | 'gzip' | 'deflate' = 'gzip',
  options?: CompressionOptions
): Promise<Buffer> {
  const compression = CompressionManager.getInstance();
  const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return compression.compressBuffer(buffer, encoding, options);
}

// Export singleton
export const compressionManager = CompressionManager.getInstance();

// Response size analyzer
export function analyzeResponseSize(response: NextResponse): {
  contentLength: number;
  contentType: string | null;
  shouldCompress: boolean;
  recommendedEncoding: string | null;
} {
  const contentLength = parseInt(response.headers.get('content-length') || '0');
  const contentType = response.headers.get('content-type');
  const compression = CompressionManager.getInstance();
  
  return {
    contentLength,
    contentType,
    shouldCompress: compression.shouldCompress(contentType, contentLength),
    recommendedEncoding: 'br'
  };
}