/** @type {import('next').NextConfig} */

// Bundle optimization configuration
const bundleOptimization = {
  // Enable experimental optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'canvas',
      'sharp'
    ],
  },

  // Configure webpack for better code splitting
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 20,
            },
            // UI components chunk
            ui: {
              test: /[\\/]components[\\/]ui[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 15,
            },
            // Admin components chunk (only loaded for admin routes)
            admin: {
              test: /[\\/]components[\\/]admin[\\/]|[\\/]app[\\/]admin[\\/]/,
              name: 'admin',
              chunks: 'all',
              priority: 10,
            },
            // Catalog components chunk
            catalog: {
              test: /[\\/]components[\\/]catalog[\\/]/,
              name: 'catalog',
              chunks: 'all',
              priority: 8,
            },
            // Heavy libraries chunk
            heavy: {
              test: /[\\/]node_modules[\\/](canvas|sharp|@google|fabric)[\\/]/,
              name: 'heavy-libs',
              chunks: 'all',
              priority: 25,
            },
          },
        },
      };

      // Tree shaking optimizations
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    // Add bundle analyzer in development
    if (dev && process.env.ANALYZE === 'true') {
      const BundleAnalyzerPlugin = require('@next/bundle-analyzer');
      config.plugins.push(new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        openAnalyzer: true,
      }));
    }

    return config;
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.easyprintsg.com',
      },
    ],
  },

  // Compression and caching
  compress: true,
  poweredByHeader: false,

  // Asset optimization
  assetPrefix: process.env.NODE_ENV === 'production' ? '/static' : undefined,

  // Modern JavaScript output
  swcMinify: true,
  
  // Runtime configuration
  env: {
    CUSTOM_KEY: 'optimization_enabled',
  },
};

module.exports = bundleOptimization;