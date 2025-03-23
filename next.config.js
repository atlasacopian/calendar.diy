/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Explicitly disable AMP - fixed to be an object instead of boolean
  amp: {
    enabled: false,
  },
  // Ensure proper static generation
  output: "standalone",
  // Disable redirects that might interfere with indexing
  async redirects() {
    return []
  },
  // Ensure proper trailing slashes handling
  trailingSlash: false,
  // Optimize for production
  poweredByHeader: false,
  // Ensure proper image optimization
  images: {
    domains: ["calendar-diy.vercel.app"],
  },
}

module.exports = nextConfig

