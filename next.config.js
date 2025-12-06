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

  // Webpack optimizations
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

  async rewrites() {
    // Backend URL - hardcode sesuai permintaan
    const backendUrl = "http://3.105.234.181:8000";

    return {
      // beforeFiles: Routes yang akan di-evaluasi SEBELUM Next.js mengecek file system
      // Ini memastikan route shipping tidak di-rewrite ke backend
      beforeFiles: [
        // CRITICAL: Route shipping HARUS di-handle oleh Next.js API route handler
        // Jangan rewrite ke backend, biarkan Next.js handle
        {
          source: "/api/shipping/:path*",
          destination: "/api/shipping/:path*",
        },
      ],
      // afterFiles: Routes yang akan di-evaluasi SETELAH Next.js mengecek file system
      // Jika file tidak ditemukan, baru di-rewrite ke backend
      afterFiles: [
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
        // Exclude /api/rajaongkir from rewrite (jika masih digunakan)
        {
          source: "/api/rajaongkir/:path*",
          destination: "/api/rajaongkir/:path*",
        },
        // Rewrite other API routes to backend (pattern umum di akhir)
        // Hanya akan match jika file tidak ditemukan di Next.js
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
};

module.exports = nextConfig;
