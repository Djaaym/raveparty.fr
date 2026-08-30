import Link from "next/link";
import type { Lang } from "@/lib/types";
import { getDict, langPrefix } from "@/lib/i18n";
import HeroSearch from "./HeroSearch";

/**
 * Le visuel de garde, servi par nous et non plus par le CDN du générateur.
 *
 * C'était le pire élément du site côté vitesse : le PNG brut de Higgsfield, **3,9 Mo**
 * pour une image de fond peinte à 42 % d'opacité derrière un masque radial, et c'est
 * lui que Lighthouse désignait comme LCP de la page d'accueil. Il arrivait en plus sans
 * `Cache-Control` (le CDN n'en pose que sur les vignettes qu'on y avait déposées), donc
 * re-téléchargé au moindre doute du navigateur, et depuis une origine tierce qu'il
 * fallait résoudre avant de pouvoir commencer.
 *
 * Réencodé en WebP à trois largeurs, c'est **14 à 141 Ko** selon le viewport (43 Ko sur
 * le mobile de référence de PageSpeed) : la même image à l'œil (on la voit à travers un
 * masque, à 42 %) pour 1 % du poids. Le nom porte le hash du fichier d'origine, ce qui
 * autorise le `immutable` d'un an posé par `headers()` dans next.config.mjs.
 *
 * Régénérer après remplacement du visuel : `python3 scripts/hero-image.py <url|fichier>`.
 */
const HERO_BASE = "/hero/rave-707891b510";
const HERO_WIDTHS = [768, 1280, 1920];

/**
 * Le hero était un composant client, uniquement parce qu'il portait le formulaire. Il
 * importait alors `COUNTRIES`, `ALL_GENRES` et `countryLabel` de `lib/data.ts` : une
 * ligne d'import pour deux listes déroulantes, et le bundler embarquait **tout le
 * catalogue** (870 événements, descriptions FR et EN comprises) dans le JavaScript de
 * la page d'accueil, 218 Ko compressés que le navigateur n'ouvre jamais.
 *
 * L'interactivité vit maintenant dans `<HeroSearch>`, seul îlot client de la section :
 * le titre, le visuel LCP et les pilules de genre repassent donc côté serveur, sans une
 * ligne de JavaScript. Les deux listes de facettes continuent d'arriver en props,
 * calculées par `Home` : le client ne reçoit que ce qu'il affiche, jamais le jeu de
 * données dont ça a été tiré, même principe que `SearchableLinks` et `ArtistDirectory`.
 */
export default function Hero({
  lang,
  count,
  countries,
  countryOptions,
  genreOptions,
  searchExamples,
}: {
  lang: Lang;
  count: number;
  countries: number;
  /** `v` = le pays tel qu'il est stocké (la clé), `l` = son libellé dans la langue. */
  countryOptions: { v: string; l: string }[];
  genreOptions: string[];
  /** Les exemples qui défilent dans le champ, tirés du catalogue côté serveur. */
  searchExamples: string[];
}) {
  const t = getDict(lang);
  const p = langPrefix(lang);

  return (
    <header className="hero">
      {/* Un <img>, plus un background-image : le preload scanner ne trouve jamais une URL
          qui ne vit que dans une feuille de style, et une image de fond n'a pas d'alt.
          Le dégradé qui assombrit le bas reste en CSS, sur ::after (voir globals.css). */}
      {/* Les trois couches décoratives (le visuel zoomé, la grille, le laser) débordent
          du hero, et c'est ce débordement que `overflow: hidden` clippait. Posé sur le
          hero, il clippait aussi le menu de suggestions, qui s'ouvre sous la barre :
          les résultats étaient coupés net au bord de la section, sous le marquee. Le
          clip vit donc sur cette boîte-ci, qui ne contient que la décoration. */}
      <div className="hero-fx" aria-hidden="true">
      <div className="hero-photo">
        <img
          src={`${HERO_BASE}-1280.webp`}
          srcSet={HERO_WIDTHS.map((w) => `${HERO_BASE}-${w}.webp ${w}w`).join(", ")}
          sizes="100vw"
          width={1920}
          height={1080}
          alt={t("hero.img.alt")}
          decoding="async"
          /* Lowercased on purpose: react-dom 18 doesn't know `fetchPriority` and would
             pass the camelCase spelling through as an unknown prop, with a dev warning. */
          {...{ fetchpriority: "high" }}
        />
      </div>
      <div className="hero-grid" />
      </div>
      <div className="wrap hero-center">
        {/* Les trois entrées ci-dessous passaient par une bibliothèque d'animation, qui
            ne servait plus qu'à elles et au scroll-reveal de la home : 35 Ko de JS
            compressé, plus l'hydratation, pour trois blocs qui montent de vingt pixels.
            Le h1 juste dessous avait déjà fait le chemin, keyframes dans globals.css. */}
        <div className="hero-badge rise-in">
          <span className="live" />{" "}
          {t("hero.badge").replace("{n}", String(count)).replace("{c}", String(countries))}
        </div>
        {/* Le h1 est l'élément LCP de la page (le plus grand texte) et il n'a jamais
            d'état invisible : son entrée ne joue que sur `translateY`, jamais sur
            l'opacité. C'est ce qui l'a sorti en premier de la bibliothèque d'animation,
            une opacité nulle sérialisée dans le HTML du serveur suspend le LCP au
            démarrage du JavaScript. Le reste de la page a suivi depuis. */}
        <h1 className="h-xl hero-h1-in">
          {t("hero.title.a")}
          <span className="gradient-text">{t("hero.title.b")}</span>
        </h1>
        <p className="lead fade-in" style={{ "--d": ".15s" } as React.CSSProperties}>
          {t("hero.lead")}
        </p>

        {/* La barre ne demande plus une ville : elle accepte un artiste, un festival,
            une soirée, un club, un genre ou un pays, et propose la page avant même la
            validation. Voir components/HeroSearch.tsx et lib/search-index.ts. */}
        <HeroSearch lang={lang} countryOptions={countryOptions} genreOptions={genreOptions} examples={searchExamples} />

        <div className="chips">
          {["Techno", "Hard Techno", "Drum & Bass", "Psytrance", "Trance", "House"].map((g) => (
            <Link className="chip" key={g} href={`${p}/explore?genre=${encodeURIComponent(g)}`}>
              {g}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
