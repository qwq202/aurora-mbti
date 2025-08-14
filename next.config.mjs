/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker部署使用standalone模式
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 性能优化
  experimental: {
    gzipSize: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 优化的webpack配置
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
      
      // 分包优化
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
        },
      }
    }
    
    return config
  },
}

export default nextConfig
