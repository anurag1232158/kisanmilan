/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: false, // ✅ Double render band — speed badhegi
  images: {
    domains: ["res.cloudinary.com"], // ✅ Cloudinary images fast
  },
  experimental: {
    optimizePackageImports: ["bootstrap"], // ✅ Bootstrap optimize
  },
};

module.exports = nextConfig;