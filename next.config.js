/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['afcmrkzwybbqaspdpykm.supabase.co', 'api.qrserver.com'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig 