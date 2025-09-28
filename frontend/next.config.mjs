/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure API routes are properly handled
  experimental: {
    serverComponentsExternalPackages: ['ai'],
  },
}

export default nextConfig
