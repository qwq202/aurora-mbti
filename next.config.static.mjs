/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  compress: true,
  // Performance optimizations
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Bundle analysis for better tree shaking
  webpack: (config, { dev, isServer }) => {
    // 启用Tree Shaking
    if (!dev && !isServer) {
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }
    return config
  },
}

export default nextConfig
