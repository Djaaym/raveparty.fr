"use client";
import { useState } from "react";
import type { Lang } from "@/lib/types";
import { getDict } from "@/lib/i18n";

type State = "idle" | "sending" | "done" | "invalid" | "unavailable" | "error";

/**
 * Les genres et les types arrivent en props plutôt que de `lib/data.ts` : ce formulaire
 * est un composant client, et l'import tirait tout le catalogue dans le bundle de
 * /organizer. Même raison que pour `<Hero>`, le client ne reçoit que ce qu'il affiche.
 */
export default function OrganizerForm({
  lang,
  genres,
  types,
}: {
  lang: Lang;
  /** Nom du genre + son dégradé, ce qui sert à peindre l'aperçu de l'affiche. */
  genres: { name: string; c1: string; c2: string }[];
  types: string[];
}) {
  const t = getDict(lang);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState(genres[0].name);
  const [artist, setArtist] = useState("");
  const [lineup, setLineup] = useState<string[]>([]);
  const [state, setState] = useState<State>("idle");

  const submit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (state === "sending") return;
    setState("sending");
    const fd = new FormData(ev.currentTarget);
    // The poster itself needs somewhere to live; until it has one, pass the file name
    // through so the owner knows there is artwork to ask for.
    const file = fd.get("poster");
    try {
      const res = await fetch("/api/organizer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: fd.get("title"), email: fd.get("email"), type: fd.get("type"), genre: fd.get("genre"),
          city: fd.get("city"), country: fd.get("country"), date: fd.get("date"), time: fd.get("time"),
          venue: fd.get("venue"), desc: fd.get("desc"), company: fd.get("company"),
          lineup, poster: file instanceof File && file.name ? file.name : "",
        }),
      });
      if (res.ok) return setState("done");
      setState(res.status === 400 ? "invalid" : res.status === 501 ? "unavailable" : "error");
    } catch {
      setState("error");
    }
  };

  const message =
    state === "invalid" ? t("org.err.invalid")
    : state === "unavailable" ? t("org.err.soon")
    : state === "error" ? t("org.err.retry")
    : state === "done" ? t("org.sent")
    : "";

  const k = genres.find((g) => g.name === genre) ?? genres[0];
  const addArtist = () => {
    const v = artist.trim();
    if (!v) return;
    setLineup((l) => [...l, v]);
    setArtist("");
  };

  return (
    <div className="explore-layout">
      {/* Le placement en colonnes vit en CSS et non en style inline : sous 1024 px
          `.explore-layout` repasse à une seule colonne, et un `gridColumn: 2` codé en
          dur y créait une deuxième colonne implicite, 142 px de débordement horizontal
          sur mobile, le seul du site. */}
      <form className="org-form" onSubmit={submit}>
        <div className="info-card">
          <h3 className="h-md" style={{ marginBottom: 20 }}>
            {t("org.details")}
          </h3>
          <div className="form-grid">
            <div className="field full">
              <label htmlFor="org-title">{t("org.f.title")}</label>
              <input className="input" name="title" id="org-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="org-type">{t("org.f.type")}</label>
              <select className="input" name="type" id="org-type">
                {types.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="org-genre">{t("org.f.genre")}</label>
              <select className="input" name="genre" id="org-genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
                {genres.map((g) => (
                  <option key={g.name}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="org-city">{t("org.f.city")}</label>
              <input className="input" name="city" id="org-city" required />
            </div>
            <div className="field">
              <label htmlFor="org-country">{t("org.f.country")}</label>
              <input className="input" name="country" id="org-country" required />
            </div>
            <div className="field">
              <label htmlFor="org-date">{t("org.f.date")}</label>
              <input className="input" name="date" id="org-date" type="date" required />
            </div>
            <div className="field">
              <label htmlFor="org-time">{t("org.f.time")}</label>
              <input className="input" name="time" id="org-time" type="time" required />
            </div>
            <div className="field">
              <label htmlFor="org-email">{t("org.f.email")}</label>
              <input className="input" name="email" id="org-email" type="email" inputMode="email" autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="org-venue">{t("org.f.venue")}</label>
              <input className="input" name="venue" id="org-venue" />
            </div>
            <div className="field full">
              <label htmlFor="org-desc">{t("org.f.desc")}</label>
              <textarea className="input" name="desc" id="org-desc" />
            </div>
          </div>
        </div>

        <div className="info-card">
          <h3 className="h-md" style={{ marginBottom: 20 }}>
            {t("org.lineup")}
          </h3>
          <div className="field full">
            <label htmlFor="org-artist">{t("org.addartists")}</label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                id="org-artist"
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
            <span className="field-label">{t("org.poster")}</span>
            <label className="upload">
              {t("org.upload")}
              <input type="file" name="poster" accept="image/*" hidden />
            </label>
          </div>
        </div>

        <input className="hp" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" defaultValue="" />
        <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 8 }} disabled={state === "sending" || state === "done"}>
          {state === "sending" ? t("alert.sending") : state === "done" ? t("org.toast") : t("org.submit")}
        </button>
        {message && (
          <p className="alert-msg" role="status" style={{ textAlign: "center" }}>
            {message}
          </p>
        )}
      </form>

      <aside className="org-preview">
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
