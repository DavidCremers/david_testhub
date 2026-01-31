/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA configuratie
  headers: async () => [
    {
      source: '/manifest.json',
      headers: [
        { key: 'Content-Type', value: 'application/manifest+json' }
      ]
    }
  ]
}

module.exports = nextConfig
