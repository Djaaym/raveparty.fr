/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow the AI-generated key visual + any remote posters.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async redirects() {
    return [
      // "Awakenings ADE – Drumcode" was one of the eight nights of the Awakenings
      // ADE run (event 58); the duplicate listing was folded into that umbrella.
      { source: "/event/awakenings-ade-drumcode", destination: "/festival/awakenings-ade", permanent: true },
      {
        source: "/en/event/awakenings-ade-drumcode",
        destination: "/en/festival/awakenings-ade",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
