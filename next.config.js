/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize build performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // External packages for server-side (required for sharp on Vercel)
  serverExternalPackages: ['sharp'],

  // Code splitting optimization
  experimental: {
    optimizeCss: true,
  },



  // Turbopack config to silence warning
  turbopack: {},

  /* 
  // Webpack optimizations - Commented out because it may cause "Cannot read properties of undefined (reading 'call')" 
  // in Next.js App Router, especially with HMR. Next.js default optimizations are recommended.
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for heavy libraries
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            framerMotion: {
              name: 'framer-motion',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            lucideReact: {
              name: 'lucide-react',
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common vendor chunk
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },
  */

  async rewrites() {
    // Backend URL - Menggunakan environment variable
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    return [
      // Biarkan route internal Next (gateway) tetap di-handle oleh Next.js
      {
        source: "/api/webinar/gateway/:path*",
        destination: "/api/webinar/gateway/:path*",
      },
      // Exclude /api/login from rewrite - it should use Next.js API route handler
      {
        source: "/api/login",
        destination: "/api/login",
      },
      // Rewrite other API routes to backend
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;