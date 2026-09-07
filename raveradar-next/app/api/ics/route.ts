import { EVENTS, eventDescL, eventPath, slugify } from "@/lib/data";
import { eventIcs } from "@/lib/ics";
import { SITE_URL } from "@/lib/site";
import type { Lang } from "@/lib/types";

/**
 * Le fichier `.ics` d'un événement, servi à `/api/ics?id=123`.
 *
 * Une **route** et non un fichier construit dans le navigateur, pour une raison
 * précise : le bouton est alors une ancre ordinaire, qui marche sans JavaScript, au
 * clic droit, en clic milieu et sur un lecteur d'écran. Un téléchargement piloté par
 * un script aurait imposé du JavaScript sur la page dont le LCP compte le plus, pour
 * un geste qui se fait très bien avec un lien.
 *
 * Le catalogue est figé au déploiement, donc la réponse aussi : un an de cache au
 * bord, c'est le même contrat que les affiches de `public/posters`.
 */
export const runtime = "nodejs";

export function GET(req: Request) {
  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  const lang: Lang = url.searchParams.get("lang") === "en" ? "en" : "fr";
  const e = Number.isFinite(id) ? EVENTS.find((x) => x.id === id) : undefined;
  if (!e) return new Response("Not found", { status: 404 });

  const page = `${SITE_URL}${lang === "en" ? "/en" : ""}${eventPath(e)}`;
  const body = eventIcs(e, page, eventDescL(e, lang));

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      /* Le nom du fichier tel qu'il arrive dans les téléchargements : « event.ics »
         pour toutes les soirées serait illisible dès la deuxième. */
      "Content-Disposition": `attachment; filename="${slugify(e.title) || "event"}.ics"`,
      "Cache-Control": "public, s-maxage=31536000, max-age=3600",
    },
  });
}
