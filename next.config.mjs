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
  // Configure output for Cloudflare Pages
  output: 'standalone',
  // Disable static optimization for pages that use browser APIs
  experimental: {
    // This allows pages to be rendered at runtime instead of build time
    // which helps with browser API usage
    appDocumentPreloading: false,
    // Optimize for Cloudflare Pages
    serverComponentsExternalPackages: ['react', 'react-dom']
  }
}

export default nextConfig
