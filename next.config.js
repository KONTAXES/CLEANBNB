const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /\/models\//,
      handler: 'CacheFirst',
      options: { cacheName: 'face-models', expiration: { maxAgeSeconds: 30 * 24 * 60 * 60 } }
    },
    {
      urlPattern: /^https:\/\/.+\.supabase\.co\//,
      handler: 'NetworkFirst',
      options: { cacheName: 'supabase-api' }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }]
  },
  webpack: (config) => {
    config.module = config.module ?? {}
    config.module.exprContextCritical = false
    return config
  }
};

module.exports = withPWA(nextConfig);
