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

      /* Pages « lieux » nées d'un libellé, pas d'une salle.
       *
       * `lib/venues.ts` n'excluait du répertoire des salles que les programmes portant
       * un guide, si bien qu'un festival éclaté dans toute une ville — « Divers lieux,
       * Rennes », « Salles multiples, Skopje », « Plusieurs lieux du centre de La Haye »
       * — ouvrait une fiche de salle nommée d'après sa propre périphrase. Le garde-fou
       * est désormais sur la forme du libellé (`isMultiVenueLabel`), et ces dix-sept
       * URLs disparaissent : chacune renvoie donc vers le festival qu'elle décrivait,
       * jamais vers un 404. Celle qui recouvrait trois festivals distincts n'a pas de
       * cible évidente et pointe sur le répertoire des salles. */
      { source: "/lieux/40-lieux-dans-toute-la-ville", destination: "/festival/full-circle-antwerp", permanent: true },
      { source: "/en/lieux/40-lieux-dans-toute-la-ville", destination: "/en/festival/full-circle-antwerp", permanent: true },
      { source: "/lieux/alter-schlachthof-et-autres-lieux-d-eupen", destination: "/festival/meakusma-festival", permanent: true },
      { source: "/en/lieux/alter-schlachthof-et-autres-lieux-d-eupen", destination: "/en/festival/meakusma-festival", permanent: true },
      { source: "/lieux/divers-lieux-rennes", destination: "/festival/festival-maintenant", permanent: true },
      { source: "/en/lieux/divers-lieux-rennes", destination: "/en/festival/festival-maintenant", permanent: true },
      { source: "/lieux/divers-lieux-various-venues", destination: "/lieux", permanent: true },
      { source: "/en/lieux/divers-lieux-various-venues", destination: "/en/lieux", permanent: true },
      { source: "/lieux/dix-lieux-a-sheffield-et-rotherham", destination: "/festival/no-bounds-festival", permanent: true },
      { source: "/en/lieux/dix-lieux-a-sheffield-et-rotherham", destination: "/en/festival/no-bounds-festival", permanent: true },
      { source: "/lieux/dom-im-berg-et-divers-lieux", destination: "/festival/elevate-festival", permanent: true },
      { source: "/en/lieux/dom-im-berg-et-divers-lieux", destination: "/en/festival/elevate-festival", permanent: true },
      { source: "/lieux/les-grandes-locos-la-mulatiere-et-divers-lieux", destination: "/festival/nuits-sonores", permanent: true },
      { source: "/en/lieux/les-grandes-locos-la-mulatiere-et-divers-lieux", destination: "/en/festival/nuits-sonores", permanent: true },
      { source: "/lieux/lieux-industriels-de-kaunas", destination: "/festival/audra-festival", permanent: true },
      { source: "/en/lieux/lieux-industriels-de-kaunas", destination: "/en/festival/audra-festival", permanent: true },
      { source: "/lieux/lieux-multiples-dans-toute-la-ville", destination: "/festival/full-circle-ghent", permanent: true },
      { source: "/en/lieux/lieux-multiples-dans-toute-la-ville", destination: "/en/festival/full-circle-ghent", permanent: true },
      { source: "/lieux/plusieurs-lieux-de-st-paul-s-bay-open-air-plage-boat-parties", destination: "/festival/rong-open-air-festival-malta", permanent: true },
      { source: "/en/lieux/plusieurs-lieux-de-st-paul-s-bay-open-air-plage-boat-parties", destination: "/en/festival/rong-open-air-festival-malta", permanent: true },
      { source: "/lieux/plusieurs-lieux-de-thessalonique-dont-the-met-hotel", destination: "/festival/reworks", permanent: true },
      { source: "/en/lieux/plusieurs-lieux-de-thessalonique-dont-the-met-hotel", destination: "/en/festival/reworks", permanent: true },
      { source: "/lieux/plusieurs-lieux-de-zakynthos-ville-et-argassi", destination: "/festival/shapes-festival-zakynthos", permanent: true },
      { source: "/en/lieux/plusieurs-lieux-de-zakynthos-ville-et-argassi", destination: "/en/festival/shapes-festival-zakynthos", permanent: true },
      { source: "/lieux/plusieurs-lieux-du-centre-de-la-haye", destination: "/festival/rewire", permanent: true },
      { source: "/en/lieux/plusieurs-lieux-du-centre-de-la-haye", destination: "/en/festival/rewire", permanent: true },
      { source: "/lieux/saalbach-hinterglemm-divers-lieux", destination: "/festival/rave-on-snow", permanent: true },
      { source: "/en/lieux/saalbach-hinterglemm-divers-lieux", destination: "/en/festival/rave-on-snow", permanent: true },
      { source: "/lieux/salles-multiples-skopje", destination: "/festival/taksirat-festival", permanent: true },
      { source: "/en/lieux/salles-multiples-skopje", destination: "/en/festival/taksirat-festival", permanent: true },
      { source: "/lieux/teatro-principal-et-divers-lieux-patrimoniaux-de-saint-jacques-de-compostelle", destination: "/festival/wos-festival", permanent: true },
      { source: "/en/lieux/teatro-principal-et-divers-lieux-patrimoniaux-de-saint-jacques-de-compostelle", destination: "/en/festival/wos-festival", permanent: true },
      { source: "/lieux/verbier-divers-lieux", destination: "/festival/polaris-festival", permanent: true },
      { source: "/en/lieux/verbier-divers-lieux", destination: "/en/festival/polaris-festival", permanent: true },
    ];
  },
};

export default nextConfig;
