/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'pixelynth.com',
      'lh3.googleusercontent.com', // For Google Auth profile pictures
      'firebasestorage.googleapis.com' // For Firebase Storage images
    ],
    remotePatterns: [
      // ...existing patterns...
    ],
    dangerouslyAllowSVG: true,
    unoptimized: true,
  },
}

module.exports = nextConfig