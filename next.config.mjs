/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  eslint: {
    // This will allow the build to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Compress responses
  compress: true,
};

export default nextConfig;
