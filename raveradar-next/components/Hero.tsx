"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Lang } from "@/lib/types";
import { getDict, langPrefix } from "@/lib/i18n";
import { COUNTRIES, ALL_GENRES, countryLabel } from "@/lib/data";

const HERO_IMG =
  "https://d8j0ntlcm91z4.cloudfront.net/user_3EfATp4Hvlogg4NEZfgyJXfo5Sh/hf_20260604_115823_221ae9a2-2422-4def-ae5a-a9a4d6b1ace9.png";

export default function Hero({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const router = useRouter();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [date, setDate] = useState("");
  const [genre, setGenre] = useState("");

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const q = new URLSearchParams();
    if (city) q.set("q", city);
    if (country) q.set("country", country);
    if (date) q.set("date", date);
    if (genre) q.set("genre", genre);
    router.push(`${p}/explore?${q.toString()}`);
  };

  return (
    <header className="hero">
      <div className="hero-photo" style={{ backgroundImage: `linear-gradient(180deg, rgba(5,6,8,.35) 0%, rgba(5,6,8,.65) 60%, var(--black) 100%), url(${HERO_IMG})` }} />
      <div className="hero-grid" />
      <div className="wrap hero-center">
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="live" /> {t("hero.badge")}
        </motion.div>
        <motion.h1
          className="h-xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
        >
          {t("hero.title.a")}
          <span className="gradient-text">{t("hero.title.b")}</span>
        </motion.h1>
        <motion.p
          className="lead"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          {t("hero.lead")}
        </motion.p>

        <motion.form
          className="search"
          onSubmit={submit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22 }}
        >
          <div className="search-field">
            <label>{t("search.city")}</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("search.city.ph")} />
          </div>
          <div className="search-field">
            <label>{t("search.country")}</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">{t("search.country.any")}</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {countryLabel(c, lang)}
                </option>
              ))}
            </select>
          </div>
          <div className="search-field">
            <label>{t("search.date")}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="search-field">
            <label>{t("search.genre")}</label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              <option value="">{t("search.genre.any")}</option>
              {ALL_GENRES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="search-go">
            <button type="submit" className="btn btn-primary">
              {t("search.go")}
            </button>
          </div>
        </motion.form>

        <div className="chips">
          {["Techno", "Hard Techno", "Drum & Bass", "Psytrance", "Free Party", "House"].map((g) => (
            <Link className="chip" key={g} href={`${p}/explore?genre=${encodeURIComponent(g)}`}>
              {g}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
