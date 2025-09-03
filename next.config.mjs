/** @type {import('next').NextConfig} */
const nextConfig = {
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  typescript: {
    ignoreBuildErrors: true
  },
  compiler: {
    styledComponents: true
  },
  images: {
    unoptimized: true
  }
};

export default nextConfig;
