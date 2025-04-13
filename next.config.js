/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['afcmrkzwybbqaspdpykm.supabase.co'],
  },
  eslint: {
    ignoreDuringBuilds: true, // Build hatası almanı engeller
  },
}


module.exports = nextConfig 