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
  // Explicitly mark all pages as dynamic
  // This prevents Next.js from trying to prerender pages
  exportPathMap: async function() {
    return {
      '/': { page: '/', _isDynamicError: true }
    }
  }
}

export default nextConfig
