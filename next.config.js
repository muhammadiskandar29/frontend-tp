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
    const backendUrl = "http://3.105.234.181:8000";
  
    return [
      // ⛔ STOP rewrite untuk route shipping → biarkan Next.js handle API serverless
      {
        source: "/api/shipping/:path*",
        has: [
          {
            type: "header",
            key: "x-no-rewrite",
            value: "(.*)",
          },
        ],
        destination: "/api/shipping/:path*",
      },
  
      // ⛔ Hentikan rewrite ke shipping API ROUTES
      {
        source: "/api/shipping/:path*",
        destination: "/api/shipping/:path*",
      },
  
      // ⛔ Hentikan rewrite route RajaOngkir jika masih ada
      {
        source: "/api/rajaongkir/:path*",
        destination: "/api/rajaongkir/:path*",
      },
  
      // ⛔ Hentikan rewrite login
      {
        source: "/api/login",
        destination: "/api/login",
      },
  
      // ⛔ Hentikan rewrite webinar gateway
      {
        source: "/api/webinar/gateway/:path*",
        destination: "/api/webinar/gateway/:path*",
      },
  
      // ✅ SEMUA route API lain baru dilempar ke backend
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },  
};

module.exports = nextConfig;
