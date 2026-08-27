"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/types";
import { getDict, langPrefix } from "@/lib/i18n";

/**
 * Le visuel de garde, servi par nous et non plus par le CDN du générateur.
 *
 * C'était le pire élément du site côté vitesse : le PNG brut de Higgsfield, **3,9 Mo**
 * pour une image de fond peinte à 42 % d'opacité derrière un masque radial — et c'est
 * lui que Lighthouse désignait comme LCP de la page d'accueil. Il arrivait en plus sans
 * `Cache-Control` (le CDN n'en pose que sur les vignettes qu'on y avait déposées), donc
 * re-téléchargé au moindre doute du navigateur, et depuis une origine tierce qu'il
 * fallait résoudre avant de pouvoir commencer.
 *
 * Réencodé en WebP à trois largeurs, c'est **14 à 141 Ko** selon le viewport (43 Ko sur
 * le mobile de référence de PageSpeed) : la même image à l'œil — on la voit à travers un
 * masque, à 42 % — pour 1 % du poids. Le nom porte le hash du fichier d'origine, ce qui
 * autorise le `immutable` d'un an posé par `headers()` dans next.config.mjs.
 *
 * Régénérer après remplacement du visuel : `python3 scripts/hero-image.py <url|fichier>`.
 */
const HERO_BASE = "/hero/rave-707891b510";
const HERO_WIDTHS = [768, 1280, 1920];

/**
 * Le hero est un composant client (le formulaire pousse vers /explore), et il importait
 * `COUNTRIES`, `ALL_GENRES` et `countryLabel` de `lib/data.ts`. Une ligne d'import pour
 * deux listes déroulantes, et le bundler embarquait **tout le catalogue** — 870
 * événements, descriptions FR et EN comprises — dans le JavaScript de la page d'accueil :
 * 218 Ko compressés que le navigateur n'ouvre jamais.
 *
 * Les options arrivent donc en props, calculées par `Home` côté serveur. C'est le même
 * principe que `SearchableLinks` et `ArtistDirectory` : le client ne reçoit que ce qu'il
 * affiche, jamais le jeu de données dont ça a été tiré.
 */
export default function Hero({
  lang,
  count,
  countries,
  countryOptions,
  genreOptions,
}: {
  lang: Lang;
  count: number;
  countries: number;
  /** `v` = le pays tel qu'il est stocké (la clé), `l` = son libellé dans la langue. */
  countryOptions: { v: string; l: string }[];
  genreOptions: string[];
}) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const router = useRouter();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [month, setMonth] = useState("");
  const [genre, setGenre] = useState("");

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const q = new URLSearchParams();
    if (city) q.set("q", city);
    if (country) q.set("country", country);
    if (month) q.set("month", month);
    if (genre) q.set("genre", genre);
    router.push(`${p}/explore?${q.toString()}`);
  };

  return (
    <header className="hero">
      {/* Un <img>, plus un background-image : le preload scanner ne trouve jamais une URL
          qui ne vit que dans une feuille de style, et une image de fond n'a pas d'alt.
          Le dégradé qui assombrit le bas reste en CSS, sur ::after (voir globals.css). */}
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
      <div className="wrap hero-center">
        {/* Les trois entrées ci-dessous passaient par une bibliothèque d'animation, qui
            ne servait plus qu'à elles et au scroll-reveal de la home : 35 Ko de JS
            compressé, plus l'hydratation, pour trois blocs qui montent de vingt pixels.
            Le h1 juste dessous avait déjà fait le chemin — keyframes dans globals.css. */}
        <div className="hero-badge rise-in">
          <span className="live" />{" "}
          {t("hero.badge").replace("{n}", String(count)).replace("{c}", String(countries))}
        </div>
        {/* Le h1 est l'élément LCP de la page (le plus grand texte) et il n'a jamais
            d'état invisible : son entrée ne joue que sur `translateY`, jamais sur
            l'opacité. C'est ce qui l'a sorti en premier de la bibliothèque d'animation
            — une opacité nulle sérialisée dans le HTML du serveur suspend le LCP au
            démarrage du JavaScript. Le reste de la page a suivi depuis. */}
        <h1 className="h-xl hero-h1-in">
          {t("hero.title.a")}
          <span className="gradient-text">{t("hero.title.b")}</span>
        </h1>
        <p className="lead fade-in" style={{ "--d": ".15s" } as React.CSSProperties}>
          {t("hero.lead")}
        </p>

        <form className="search rise-in" onSubmit={submit} style={{ "--d": ".22s" } as React.CSSProperties}>
          <div className="search-field">
            <label htmlFor="hero-city">{t("search.city")}</label>
            <input id="hero-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("search.city.ph")} />
          </div>
          <div className="search-field">
            <label htmlFor="hero-country">{t("search.country")}</label>
            <select id="hero-country" value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">{t("search.country.any")}</option>
              {countryOptions.map((c) => (
                <option key={c.v} value={c.v}>
                  {c.l}
                </option>
              ))}
            </select>
          </div>
          <div className="search-field">
            <label htmlFor="hero-month">{t("search.month")}</label>
            <input id="hero-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div className="search-field">
            <label htmlFor="hero-genre">{t("search.genre")}</label>
            <select id="hero-genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="">{t("search.genre.any")}</option>
              {genreOptions.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="search-go">
            <button type="submit" className="btn btn-primary">
              {t("search.go")}
            </button>
          </div>
        </form>

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
