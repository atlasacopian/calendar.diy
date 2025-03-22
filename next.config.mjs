/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Explicitly disable AMP
  amp: false,
  // Ensure proper static generation
  output: 'standalone',
  // Disable redirects that might interfere with indexing
  async redirects() {
    return [];
  },
  // Ensure proper trailing slashes handling
  trailingSlash: false,
  // Optimize for production
  poweredByHeader: false,
  // Ensure proper image optimization
  images: {
    domains: ['calendar-diy.vercel.app'],
  },
}

// Use ES modules export syntax for .mjs files
export default nextConfig;

