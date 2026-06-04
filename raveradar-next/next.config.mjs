/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow the AI-generated key visual + any remote posters.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
