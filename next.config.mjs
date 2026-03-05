/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['playwright'],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
