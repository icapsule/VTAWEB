/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Vercel deployment
  output: undefined, // Let Vercel handle this
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
