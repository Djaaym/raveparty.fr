import type { MetadataRoute } from "next";
import { EVENTS, ALL_GENRES, genreSlug, eventPath, isPast, lastDay } from "@/lib/data";
import { PLACES } from "@/lib/places";
import { ARTISTS } from "@/lib/artists";
import { VENUES } from "@/lib/venues";
import { COUNTRIES_INDEX } from "@/lib/countries";
import { SITE_URL } from "@/lib/site";
import { CATALOG_UPDATED } from "@/lib/catalog-version";
import { livePlaceSlugs } from "@/lib/thin-pages";

type Entry = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  /** Date de dernière modification réelle du contenu, jamais l'heure du build. */
  lastModified: Date;
  /**
   * Le chemin anglais, quand il diffère du français.
   *
   * L'immense majorité des pages ont la même adresse à un préfixe près, `/en` collé
   * devant : c'est vrai de tout ce qui sort du catalogue. Ça devient faux dès qu'une
   * page a un titre traduit, `/a-propos` et `/en/about`, et sans ce champ le sitemap
   * annoncerait `/en/a-propos`, qui répond 404. Déclarer une URL morte dans un sitemap
   * est pire que ne pas la déclarer, c'est une erreur que la Search Console remonte.
   */
  enPath?: string;
};

/**
 * Le sitemap.
 *
 * Une entrée par chemin indépendant de la langue ; les deux variantes sont émises,
 * chacune déclarant l'autre par `alternates.languages`, pour que les arbres FR et EN
 * ne se concurrencent pas.
 *
 * **`lastModified` dit quelque chose de vrai.** Il valait `new Date()` pour les 13 554
 * URLs, réécrit à chaque déploiement : un signal que tout porte et qui bouge à chaque
 * build ne distingue rien, Google le tient pour du bruit, et on perdait le seul moyen
 * de faire recrawler les quarante fiches qui ont changé plutôt que les treize mille
 * autres. Il y a maintenant deux cas, et les deux sont exacts :
 *
 * - une **édition terminée** ne bouge plus jamais ; la dernière fois que sa page a
 *   changé, c'est le jour où elle est passée en archive, donc le lendemain de sa
 *   dernière date. Cette valeur est stable d'un déploiement à l'autre, ce qui est tout
 *   l'intérêt : ces ~250 pages cessent de réclamer un passage à chaque build ;
 * - tout le reste suit **`CATALOG_UPDATED`**, la date du dernier commit qui a touché
 *   `lib/data.ts` (`scripts/catalog-version.mjs`). Un redéploiement qui ne change pas
 *   les données ne fait plus bouger le sitemap.
 *
 * **Les pages sans contenu n'y entrent pas.** Douze pages de lieu n'ont aucune date à
 * venir et affichent « pas encore d'événement » : elles étaient listées à 0,9, la
 * priorité la plus haute du fichier. Voir `lib/thin-pages.ts`, qui porte la règle et
 * la fait aussi appliquer par le `robots` de la page.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const catalog = new Date(CATALOG_UPDATED);
  /* Le lendemain de la dernière date : c'est le jour où la fiche a pris son bandeau
     « édition terminée », donc la dernière fois que ce que la page affiche a changé. */
  const archivedOn = (e: (typeof EVENTS)[number]) => new Date(`${lastDay(e)}T12:00:00Z`);

  const live = livePlaceSlugs();

  const entries: Entry[] = [
    { path: "", priority: 1, changeFrequency: "daily", lastModified: catalog },
    { path: "/explore", priority: 0.9, changeFrequency: "daily", lastModified: catalog },
    { path: "/rave-party/ce-week-end", priority: 0.9, changeFrequency: "daily", lastModified: catalog },
    { path: "/rave-party/autour-de-moi", priority: 0.8, changeFrequency: "daily", lastModified: catalog },
    { path: "/villes", priority: 0.8, changeFrequency: "weekly", lastModified: catalog },
    { path: "/pays", priority: 0.8, changeFrequency: "weekly", lastModified: catalog },
    { path: "/genres", priority: 0.8, changeFrequency: "weekly", lastModified: catalog },
    { path: "/artistes", priority: 0.7, changeFrequency: "weekly", lastModified: catalog },
    { path: "/lieux", priority: 0.7, changeFrequency: "weekly", lastModified: catalog },
    { path: "/map", priority: 0.6, changeFrequency: "weekly", lastModified: catalog },
    { path: "/organizer", priority: 0.5, changeFrequency: "monthly", lastModified: catalog },
    /* Les pages institutionnelles. Elles bougent rarement, et c'est exactement ce que
       leur `lastmod` doit dire : la date de leur dernière révision, écrite à la main,
       pas celle du catalogue qu'elles ne montrent pas. */
    { path: "/a-propos", enPath: "/en/about", priority: 0.4, changeFrequency: "yearly", lastModified: new Date("2026-09-06") },
    { path: "/contact", enPath: "/en/contact", priority: 0.4, changeFrequency: "yearly", lastModified: new Date("2026-09-06") },
    { path: "/mentions-legales", enPath: "/en/legal-notice", priority: 0.2, changeFrequency: "yearly", lastModified: new Date("2026-09-06") },
    { path: "/confidentialite", enPath: "/en/privacy", priority: 0.3, changeFrequency: "yearly", lastModified: new Date("2026-09-06") },
  ];
  /* `/account` n'y est plus : c'est une page de connexion, elle n'a rien à faire dans
     un index de recherche, et elle porte désormais `noindex`. */

  ALL_GENRES.forEach((g) =>
    entries.push({ path: `/genres/${genreSlug(g)}`, priority: 0.8, changeFrequency: "weekly", lastModified: catalog }),
  );
  PLACES.forEach((p) => {
    // Une page de lieu sans date à venir n'entre pas : voir `lib/thin-pages.ts`.
    if (!live.has(p.slug)) return;
    entries.push({ path: `/rave-party/${p.slug}`, priority: 0.9, changeFrequency: "weekly", lastModified: catalog });
    entries.push({ path: `/festival/${p.slug}`, priority: 0.8, changeFrequency: "weekly", lastModified: catalog });
  });
  EVENTS.forEach((e) => {
    const done = isPast(e);
    entries.push({
      path: eventPath(e),
      priority: done ? 0.4 : e.type === "Festival" ? 0.9 : 0.7,
      changeFrequency: done ? "yearly" : "weekly",
      lastModified: done ? archivedOn(e) : catalog,
    });
  });
  COUNTRIES_INDEX.forEach((c) =>
    entries.push({ path: `/pays/${c.slug}`, priority: 0.8, changeFrequency: "weekly", lastModified: catalog }),
  );
  ARTISTS.forEach((a) =>
    entries.push({ path: `/artistes/${a.slug}`, priority: 0.6, changeFrequency: "weekly", lastModified: catalog }),
  );
  VENUES.forEach((v) =>
    entries.push({ path: `/lieux/${v.slug}`, priority: 0.6, changeFrequency: "weekly", lastModified: catalog }),
  );
  // No `/show/` entries: those URLs are 301 forwarders now, not pages.

  const seen = new Set<string>();
  const out: MetadataRoute.Sitemap = [];
  for (const { path, priority, changeFrequency, lastModified, enPath } of entries) {
    if (seen.has(path)) continue;
    seen.add(path);
    const fr = `${SITE_URL}${path}`;
    const en = `${SITE_URL}${enPath ?? `/en${path}`}`;
    const languages = { "fr-FR": fr, "en-GB": en, "x-default": fr };
    out.push({ url: fr, lastModified, changeFrequency, priority, alternates: { languages } });
    out.push({ url: en, lastModified, changeFrequency, priority: priority * 0.9, alternates: { languages } });
  }
  return out;
}
