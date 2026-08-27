"use client";

import { useState } from "react";
import { embedUrl, postUrl } from "@/lib/instagram";

/**
 * Les posts Instagram d'un compte, rendus par le lecteur officiel d'Instagram.
 *
 * Deux contraintes se croisent ici, et la solution est la même pour les deux.
 *
 * 1. **RGPD.** Une `<iframe>` Instagram charge des scripts Meta et pose ses cookies dès
 *    l'affichage de la page. Poser six traceurs tiers sur chaque fiche parce qu'on trouve
 *    ça joli n'est pas défendable, et le reste du site ne le fait nulle part ailleurs.
 * 2. **Performance.** Six embeds, c'est plusieurs mégaoctets de JavaScript tiers sur une
 *    page dont le contenu utile — dates, line-up, billetterie — tient en quelques Ko.
 *
 * D'où le rendu en deux temps. Par défaut : six tuiles qui sont de vrais liens `<a>` vers
 * les posts, indexables, sans une seule requête vers Meta. Au clic sur le bouton, les
 * tuiles laissent la place aux embeds officiels. Le lecteur choisit, et il sait ce qu'il
 * déclenche parce que la ligne sous le bouton le dit.
 */
export default function InstagramFeed({
  handle,
  posts,
  labels,
}: {
  handle: string;
  posts: string[];
  labels: { load: string; note: string; open: string; postnum: string };
}) {
  const [loaded, setLoaded] = useState(false);
  const six = posts.slice(0, 6);

  if (loaded) {
    return (
      <div className="ig-embeds">
        {six.map((code) => (
          <iframe
            key={code}
            src={embedUrl(code)}
            title={labels.open}
            loading="lazy"
            allowFullScreen
            scrolling="no"
            frameBorder={0}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="ig-tiles">
        {six.map((code, i) => (
          <a
            key={code}
            href={postUrl(code)}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="ig-tile"
          >
            <span className="ig-tile-glyph" aria-hidden="true">
              ▣
            </span>
            <span className="ig-tile-label">
              @{handle} · {labels.postnum.replace("{n}", String(i + 1))}
            </span>
          </a>
        ))}
      </div>
      <button type="button" className="btn btn-ghost btn-sm ig-load" onClick={() => setLoaded(true)}>
        {labels.load}
      </button>
      <p className="ig-note">{labels.note}</p>
    </>
  );
}
