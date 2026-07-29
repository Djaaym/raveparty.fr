"use client";
import { useState } from "react";
import type { Lang } from "@/lib/types";
import { ALL_GENRES, TYPES, GENRES } from "@/lib/data";
import { getDict } from "@/lib/i18n";

export default function OrganizerForm({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState(ALL_GENRES[0]);
  const [artist, setArtist] = useState("");
  const [lineup, setLineup] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const k = GENRES[genre];
  const addArtist = () => {
    const v = artist.trim();
    if (!v) return;
    setLineup((l) => [...l, v]);
    setArtist("");
  };

  return (
    <div className="explore-layout">
      <form
        style={{ gridColumn: 1, order: 2 }}
        onSubmit={(e) => {
          e.preventDefault();
          setDone(true);
        }}
      >
        <div className="info-card">
          <h3 className="h-md" style={{ marginBottom: 20 }}>
            {t("org.details")}
          </h3>
          <div className="form-grid">
            <div className="field full">
              <label>{t("org.f.title")}</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="field">
              <label>{t("org.f.type")}</label>
              <select className="input">
                {TYPES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t("org.f.genre")}</label>
              <select className="input" value={genre} onChange={(e) => setGenre(e.target.value)}>
                {ALL_GENRES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t("org.f.city")}</label>
              <input className="input" required />
            </div>
            <div className="field">
              <label>{t("org.f.country")}</label>
              <input className="input" required />
            </div>
            <div className="field">
              <label>{t("org.f.date")}</label>
              <input className="input" type="date" required />
            </div>
            <div className="field">
              <label>{t("org.f.time")}</label>
              <input className="input" type="time" required />
            </div>
            <div className="field full">
              <label>{t("org.f.venue")}</label>
              <input className="input" />
            </div>
            <div className="field full">
              <label>{t("org.f.desc")}</label>
              <textarea className="input" />
            </div>
          </div>
        </div>

        <div className="info-card">
          <h3 className="h-md" style={{ marginBottom: 20 }}>
            {t("org.lineup")}
          </h3>
          <div className="field full">
            <label>{t("org.addartists")}</label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                className="input"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addArtist();
                  }
                }}
                placeholder={t("org.artist.ph")}
              />
              <button type="button" className="btn btn-ghost" onClick={addArtist}>
                {t("org.add")}
              </button>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {lineup.map((a, i) => (
              <span
                key={i}
                className="gpill"
                style={{ padding: "8px 12px", display: "inline-flex", gap: 8, alignItems: "center" }}
              >
                {a}
                <b
                  style={{ cursor: "pointer", color: "var(--magenta)" }}
                  onClick={() => setLineup((l) => l.filter((_, j) => j !== i))}
                >
                  ✕
                </b>
              </span>
            ))}
          </div>
        </div>

        <div className="info-card">
          <h3 className="h-md" style={{ marginBottom: 20 }}>
            {t("org.media")}
          </h3>
          <div className="field full">
            <label>{t("org.poster")}</label>
            <label className="upload">
              {t("org.upload")}
              <input type="file" accept="image/*" hidden />
            </label>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 8 }}>
          {done ? t("org.toast") : t("org.submit")}
        </button>
      </form>

      <aside style={{ gridColumn: 2, order: 1 }}>
        <div className="filters" style={{ padding: 18 }}>
          <span className="eyebrow">{t("org.preview")}</span>
          <article className="card" style={{ marginTop: 16, cursor: "default" }}>
            <span className="card-genre-bar" />
            <div className="card-media">
              <div className="poster" style={{ backgroundImage: `linear-gradient(150deg,${k.c1},${k.c2})` }} />
              <div className="card-top">
                <span className="tag type">{genre}</span>
              </div>
              <div className="card-body">
                <div className="card-date">DATE · TIME</div>
                <h3 className="card-title">{title || t("org.preview.title")}</h3>
                <div className="card-loc">
                  📍 {t("org.f.city")}, {t("org.f.country")}
                </div>
              </div>
            </div>
          </article>
          <p style={{ color: "var(--grey)", fontSize: ".82rem", marginTop: 16 }}>{t("org.preview.note")}</p>
        </div>
      </aside>
    </div>
  );
}
