/**
 * Trouver les coordonnées d'une salle.
 *
 * Le formulaire de dépôt ne demande pas de `lat`/`lng` : un promoteur tape « Le Sucre,
 * Lyon », pas des degrés décimaux. Sans elles, l'événement n'a ni point sur la carte ni
 * distance pour « autour de moi », et `merge.py` refuse la fiche.
 *
 * On interroge donc Nominatim (OpenStreetMap), du plus précis au plus large : la salle
 * avec son adresse, la salle seule, l'adresse seule, puis la ville. **On ne rend jamais
 * un point approximatif pour un point manquant** : sans réponse, la fonction rend `null`
 * et l'appelant le dit, ce qui est la règle de contenu du projet appliquée aux
 * coordonnées.
 *
 * Nominatim exige un agent identifiable et une requête par seconde au plus. Ce sont des
 * conditions d'usage, pas des recommandations : on géocode donc **au moment de la
 * validation**, une salle à la fois, et jamais en boucle sur un lot entier depuis une
 * fonction serverless qui a quelques secondes de budget.
 */

const UA = "RaveRadar/1.0 (https://www.raveparty.fr; djaym.info@gmail.com)";

export interface Place {
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
}

export interface Coords {
  lat: number;
  lng: number;
  /** La requête qui a répondu, pour que la relecture sache sur quoi le point est tombé. */
  query: string;
}

/** Les requêtes à essayer, de la plus précise à la plus large. */
function candidates(p: Place): string[] {
  const city = [p.city, p.country].filter(Boolean).join(", ");
  return [
    [p.venue, p.address, city].filter(Boolean).join(", "),
    [p.venue, city].filter(Boolean).join(", "),
    [p.address, city].filter(Boolean).join(", "),
    city,
  ].filter((q, i, all) => q && q.includes(",") && all.indexOf(q) === i);
}

export async function geocode(place: Place, timeoutMs = 6000): Promise<Coords | null> {
  for (const query of candidates(place)) {
    const url =
      "https://nominatim.openstreetmap.org/search?" +
      new URLSearchParams({ q: query, format: "jsonv2", limit: "1" }).toString();
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA },
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) continue;
      const rows = (await res.json()) as { lat?: string; lon?: string }[];
      const hit = rows?.[0];
      if (hit?.lat && hit?.lon) {
        return { lat: Number(Number(hit.lat).toFixed(6)), lng: Number(Number(hit.lon).toFixed(6)), query };
      }
    } catch {
      // Un échec réseau sur une requête n'empêche pas d'essayer la suivante, plus large.
    }
  }
  return null;
}
