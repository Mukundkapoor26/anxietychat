/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Completely disable static generation
  staticPageGenerationTimeout: 1000,
  output: 'standalone',
  experimental: {
    appDocumentPreloading: false,
    serverComponentsExternalPackages: ['react', 'react-dom']
  },
  // Configure for App Router
  generateBuildId: async () => {
    // This makes the build ID deterministic to avoid issues with Cloudflare's caching
    return 'anxiety-chat-build'
  }
}

export default nextConfig
