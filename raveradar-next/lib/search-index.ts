import type { Lang, SuggestKind, Suggestion } from "./types";
import { COUNTRY_FR, EVENTS, GENRES, countryLabel, eventPath, genreSlug, isPast, todayISO } from "./data";
import { fmtDate } from "./format";
import { ARTISTS } from "./artists";
import { VENUES } from "./venues";
import { PLACES, eventsForPlace } from "./places";
import { COUNTRIES_INDEX } from "./countries";

/**
 * L'index de la barre de recherche : « tape n'importe quoi ».
 *
 * Le champ du hero ne demandait qu'une ville, alors que le site porte 1 887 artistes,
 * 515 salles, 900 dates et 38 pays qui ont tous une page à eux. Un lecteur qui tape
 * « Amelie Lens » ou « Berghain » dans un champ étiqueté « Ville » n'obtenait rien,
 * puisque la valeur partait telle quelle dans le filtre plein texte de /explore.
 *
 * Cet index les réunit tous, et il **vit côté serveur uniquement** : il dérive de
 * `lib/data.ts`, que la règle du projet interdit d'importer depuis un composant client
 * (le bundler y embarquerait les 900 événements et leurs descriptions FR *et* EN, 218 Ko
 * compressés). Les suggestions transitent donc par `/api/search`, et la page d'accueil
 * n'embarque rien du catalogue.
 */
export type { SuggestKind, Suggestion };

interface Rec {
  k: SuggestKind;
  n: string;
  h: string;
  /** Le nom réduit (sans accents, minuscules), la seule chose que la correspondance lit. */
  norm: string;
  /** Un second nom cherchable, la ville d'une salle par exemple. */
  norm2?: string;
  /** Nombre de dates portées, utilisé comme prime de notoriété dans le score. */
  count: number;
  /** Contexte, résolu à la réponse pour rester bilingue. */
  city?: string;
  country?: string;
  date?: string;
  past?: boolean;
}

/** Même réduction que le filtre de `SearchableLinks` : « creteil » doit trouver « Créteil ». */
export const fold = (s: string): string =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/**
 * Le poids d'un type de résultat.
 *
 * Une ville et un genre priment sur une salle : ce sont les intentions les plus larges,
 * et leur page couvre tout ce que les autres montrent. Un événement passe après son
 * festival parce que le second est une marque, le premier une date.
 */
const KIND_WEIGHT: Record<SuggestKind, number> = {
  genre: 62,
  city: 58,
  country: 50,
  festival: 46,
  artist: 42,
  venue: 32,
  event: 26,
};

function build(): Rec[] {
  const today = todayISO();
  const out: Rec[] = [];

  /* Un titre = une entrée, pas une par édition. Le slug nu (`/festival/sonar`) désigne
     déjà l'édition à venir : proposer les trois éditions de Sónar mettrait la même
     marque trois fois dans un menu de huit lignes. */
  const byTitle = new Map<string, { ids: number[] }>();
  for (const e of EVENTS) {
    const g = byTitle.get(e.title);
    if (g) g.ids.push(e.id);
    else byTitle.set(e.title, { ids: [e.id] });
  }
  for (const [title, g] of byTitle) {
    const editions = g.ids.map((id) => EVENTS.find((e) => e.id === id)!).sort((a, b) => a.date.localeCompare(b.date));
    const pick = editions.find((e) => !isPast(e, today)) ?? editions[editions.length - 1];
    out.push({
      k: pick.type === "Festival" ? "festival" : "event",
      n: title,
      h: eventPath(pick),
      norm: fold(title),
      count: editions.length,
      city: pick.city,
      country: pick.country,
      date: pick.date,
      past: isPast(pick, today),
    });
  }

  for (const a of ARTISTS)
    out.push({
      k: "artist",
      n: a.name,
      h: `/artistes/${a.slug}`,
      norm: fold(a.name),
      count: a.eventIds.length,
    });

  for (const v of VENUES)
    out.push({
      k: "venue",
      n: v.name,
      h: `/lieux/${v.slug}`,
      norm: fold(v.name),
      norm2: fold(v.city),
      count: v.eventIds.length,
      city: v.city,
      country: v.country,
    });

  /* Une ville sans date à venir n'est pas une suggestion : la page existe, mais elle
     affiche « pas encore d'événement ». Même règle que les pilules de la home, un lien
     qui promet une ville et n'en tient aucune vaut moins que pas de lien du tout.
     Le compte passe par `eventsForPlace()` et pas par le nom de la ville : un lieu
     rassemble ses communes (`match`), donc Villeurbanne compte pour Lyon. */
  for (const pl of PLACES) {
    const n = eventsForPlace(pl).filter((e) => !isPast(e, today)).length;
    if (!n) continue;
    out.push({
      k: "city",
      n: pl.label,
      h: `/rave-party/${pl.slug}`,
      norm: fold(pl.label),
      // Les communes rattachées sont cherchables : « Villeurbanne » doit rendre Lyon,
      // c'est bien la page qui porte la date, et le lecteur n'a pas à le deviner.
      norm2: pl.match?.length ? fold(pl.match.join(" | ")) : undefined,
      count: n,
    });
  }

  /* Les villes du calendrier qui n'ont pas de page à elles.
     `/rave-party/{slug}` n'existe que pour les 90 entrées de `PLACES`, et y lier une
     ville absente donnerait un 404 (la règle du projet l'interdit explicitement). Mais
     ne rien proposer du tout est pire : le catalogue programme Créteil, Anvers ou
     Cracovie, et le lecteur qui les tape recevait un menu vide. La suggestion tombe
     alors sur la recherche `/explore`, qui, elle, couvre tout le catalogue. */
  const covered = new Set<string>();
  for (const pl of PLACES) {
    covered.add(fold(pl.label));
    for (const m of pl.match ?? []) covered.add(fold(m));
  }
  const loose = new Map<string, { city: string; country: string; n: number }>();
  for (const e of EVENTS) {
    if (isPast(e, today) || covered.has(fold(e.city))) continue;
    const key = fold(e.city);
    const cur = loose.get(key);
    if (cur) cur.n++;
    else loose.set(key, { city: e.city, country: e.country, n: 1 });
  }
  for (const { city, country, n } of loose.values())
    out.push({
      k: "city",
      n: city,
      h: `/explore?q=${encodeURIComponent(city)}`,
      norm: fold(city),
      count: n,
      country,
    });

  for (const g of Object.keys(GENRES))
    out.push({
      k: "genre",
      n: g,
      h: `/genres/${genreSlug(g)}`,
      norm: fold(g),
      count: EVENTS.filter((e) => e.genres.includes(g) && !isPast(e, today)).length,
    });

  /* Le pays se cherche dans les deux langues. Le catalogue le stocke en anglais
     (« Netherlands »), c'est une clé et pas un affichage, mais un lecteur français
     tape « Pays-Bas » : sans le libellé FR dans l'index, la page pays du site restait
     introuvable depuis le site français. Le nom rendu, lui, est résolu à la réponse. */
  for (const c of COUNTRIES_INDEX) {
    const fr = COUNTRY_FR[c.name] ?? c.name;
    out.push({
      k: "country",
      n: fr,
      h: `/pays/${c.slug}`,
      norm: fold(fr),
      norm2: fold(c.name),
      count: c.eventIds.length,
      country: c.name,
    });
  }

  return out;
}

/* Monté une fois par instance : la construction parcourt les 900 événements et les
   1 887 artistes, la refaire à chaque frappe de clavier serait absurde. */
let INDEX: Rec[] | null = null;
const index = (): Rec[] => (INDEX ??= build());

/**
 * Le score d'une correspondance.
 *
 * Trois qualités, dans cet ordre : le nom entier, un début de mot, puis n'importe où.
 * « Rex » doit rendre le Rex Club avant « T-Rex Warehouse », et « lens » doit rendre
 * Amelie Lens sans que la sous-chaîne de « Valenciennes » passe devant.
 */
function score(rec: Rec, q: string): number {
  const hay = rec.norm;
  let base: number;
  if (hay === q) base = 1000;
  else if (hay.startsWith(q)) base = 760;
  else if (hay.includes(" " + q) || hay.includes("-" + q)) base = 560;
  else if (hay.includes(q)) base = 300;
  // Le second nom (les communes d'un lieu, la ville d'une salle) ne se cherche qu'en
  // début de mot : sur une liste d'alias concaténés, `includes` seul ferait de « ans »
  // une correspondance de « Nanterre ».
  else if (rec.norm2 && (rec.norm2.startsWith(q) || rec.norm2.includes(" " + q))) base = 240;
  else return 0;

  // Une correspondance qui couvre presque tout le nom est meilleure qu'un fragment.
  const cover = Math.round((q.length / Math.max(hay.length, 1)) * 60);
  // La notoriété départage à qualité égale, plafonnée pour qu'elle ne prime jamais.
  const pop = Math.min(rec.count, 25);
  // Une édition terminée reste trouvable, mais jamais devant une date à venir.
  const stale = rec.past ? 260 : 0;
  return base + cover + pop + KIND_WEIGHT[rec.k] - stale;
}

/** Ce qu'on écrit à droite d'une suggestion, dans la langue du lecteur. */
function meta(rec: Rec, lang: Lang): string | undefined {
  /* « date » s'écrit pareil dans les deux langues, y compris au pluriel : une seule
     branche suffit, en dupliquer deux identiques donnerait l'illusion d'une traduction. */
  if (rec.k === "artist" || rec.k === "genre" || rec.k === "country" || rec.k === "city")
    return `${rec.count} date${rec.count > 1 ? "s" : ""}`;
  /* Sur une date, « quand » prime sur « dans quel pays » : c'est la première question
     qu'on se pose, et la ville la situe déjà. Le pays reste sur la fiche. */
  if (rec.k === "event" || rec.k === "festival")
    return [rec.date && fmtDate(rec.date, lang), rec.city].filter(Boolean).join(" · ");
  return [rec.city, rec.country && countryLabel(rec.country, lang)].filter(Boolean).join(", ") || undefined;
}

/**
 * Les meilleures suggestions pour une saisie.
 *
 * `perKind` empêche qu'un mot fréquent (« techno », « warehouse ») remplisse le menu
 * d'une seule catégorie : sur huit lignes, trois artistes suffisent à dire qu'il y en a.
 *
 * `kinds` restreint la recherche à certaines catégories. Le champ de line-up du dépôt
 * d'événement s'en sert pour ne proposer que des artistes : il complète un nom, pas une
 * destination, et une ville dans cette liste serait une faute de frappe qui se publie.
 * Poser `perKind` au plafond va alors de soi, la limite de catégorie n'a plus d'objet.
 */
export function suggest(raw: string, lang: Lang, limit = 8, perKind = 3, kinds?: SuggestKind[]): Suggestion[] {
  const q = fold(raw);
  if (q.length < 2) return [];
  const hits: { rec: Rec; s: number }[] = [];
  for (const rec of index()) {
    if (kinds && !kinds.includes(rec.k)) continue;
    const s = score(rec, q);
    if (s > 0) hits.push({ rec, s });
  }
  hits.sort((a, b) => b.s - a.s || a.rec.n.localeCompare(b.rec.n));

  const seen = new Map<SuggestKind, number>();
  const out: Suggestion[] = [];
  for (const { rec } of hits) {
    if (out.length >= limit) break;
    const n = seen.get(rec.k) ?? 0;
    if (n >= perKind) continue;
    seen.set(rec.k, n + 1);
    out.push({
      k: rec.k,
      // Le pays est indexé sur son libellé français, il s'affiche dans la langue lue.
      n: rec.k === "country" && rec.country ? countryLabel(rec.country, lang) : rec.n,
      h: rec.h,
      m: meta(rec, lang) || undefined,
      ...(rec.past ? { past: true } : {}),
    });
  }
  return out;
}

/** Les exemples qui défilent dans le champ, tirés du catalogue et non écrits à la main. */
export function searchExamples(n = 6): string[] {
  const today = todayISO();
  const live = EVENTS.filter((e) => !isPast(e, today));
  const out: string[] = [];
  const push = (v?: string) => {
    if (v && !out.includes(v)) out.push(v);
  };
  // Un artiste très programmé, une grande ville, un festival, une salle : le champ dit
  // ce qu'il accepte en le montrant, plutôt qu'en l'énumérant dans une étiquette.
  const topArtist = [...ARTISTS].sort((a, b) => b.eventIds.length - a.eventIds.length)[0];
  push(topArtist?.name);
  push(live.find((e) => e.type === "Festival")?.title);
  push([...VENUES].sort((a, b) => b.eventIds.length - a.eventIds.length)[0]?.name);
  push(live.find((e) => e.country === "France")?.city);
  push("Techno");
  push(live.find((e) => e.country !== "France")?.city);
  return out.slice(0, n);
}
