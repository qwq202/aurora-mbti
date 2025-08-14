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
  // Performance optimizations
  // 移除可能导致构建问题的实验性功能
  // experimental: {
  //   optimizeCss: true,
  // },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // 简化webpack配置
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.usedExports = true
    }
    return config
  },
}

export default nextConfig
