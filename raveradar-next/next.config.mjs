/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow the AI-generated key visual + any remote posters.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  /**
   * Genres retirés du catalogue → redirection permanente vers le hub des genres.
   *
   * Le genre « Free Party » a disparu avec le repositionnement du site sur l'annuaire
   * des festivals électro : `/genres/free-party` n'est donc plus généré par
   * `generateStaticParams()` et retomberait en 404. Même règle que pour les slugs
   * d'événements renommés (`lib/renamed.ts`) : une URL indexée ne redevient jamais un
   * 404. Ici et pas dans le middleware — une redirection statique n'a pas besoin du
   * runtime edge, et elle est appliquée avant tout routage.
   *
   * `permanent: true` rend un **308** (comme les redirections `/show/`), avec un vrai
   * en-tête `Location` — vérifié au `curl -D -`, le seul contrôle qui vaille ici.
   */
  async redirects() {
    return [
      { source: "/genres/free-party", destination: "/genres", permanent: true },
      { source: "/en/genres/free-party", destination: "/en/genres", permanent: true },
    ];
  },
};

export default nextConfig;
