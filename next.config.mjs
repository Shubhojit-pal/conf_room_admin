/** @type {import('next').NextConfig} */
const nextConfig = {
  // Rely on default Next.js outputs for standard Vercel Hosting
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
