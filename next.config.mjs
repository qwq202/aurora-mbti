import path from 'path'
import { fileURLToPath } from 'url'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/config.ts')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@lobehub/icons'],
  // Dockerstandalone
  output: 'standalone',
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 
  experimental: {
    gzipSize: true,
    //  optimizeFonts 
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  //  fontLoaders 
  // webpack
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
      
      // 
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui/,
            name: 'radix-ui',
            priority: 10,
            chunks: 'all',
          },
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react/,
            name: 'lucide-react',
            priority: 10,
            chunks: 'all',
          },
          // 
          fonts: {
            test: /[\\/]node_modules[\\/]geist/,
            name: 'fonts',
            priority: 15,
            chunks: 'all',
          },
        },
      }
    }
    
    return config
  },
  // 
  poweredByHeader: false,
  // 
  compress: true,
}

export default withNextIntl(nextConfig)
