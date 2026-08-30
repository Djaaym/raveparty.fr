"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/types";
import type { EventSubmission, FieldErrors } from "@/lib/accounts";
import { getDict, langPrefix } from "@/lib/i18n";
import { parseSubmission } from "@/lib/submissions";
import { ALL_SUBGENRES, MAX_SUBGENRES, SUBGENRES } from "@/lib/subgenres";
import { fmtDate } from "@/lib/format";
import PromoterAuth from "./PromoterAuth";
import RichEditor from "./RichEditor";
import TagPicker from "./TagPicker";
import { isError, post, usePromoter } from "./usePromoter";

/**
 * Le studio de dépôt d'un événement.
 *
 * Trois choses le séparent de la version précédente, et toutes les trois viennent du
 * même constat : le formulaire demandait à un professionnel de décrire sa soirée avec
 * les moyens d'un formulaire de contact.
 *
 * 1. **Il faut un compte.** L'ancien formulaire postait un mail anonyme, donc rien ne
 *    distinguait l'organisateur du festival de quelqu'un qui recopie une affiche. Ici la
 *    session dit qui dépose, le propriétaire a validé la structure une fois pour toutes,
 *    et la relecture porte sur l'événement au lieu de porter sur l'expéditeur.
 * 2. **Un genre principal ne décrit pas une affiche.** Les sous-genres sont multiples,
 *    pris dans le vocabulaire de `lib/subgenres.ts`, ouverts à la saisie libre. Ils
 *    n'auront pas de page, cf. la règle sur `ARTIST_STYLES.s` : ils décrivent, ils ne
 *    cliquent pas.
 * 3. **Le line-up se complète depuis le catalogue.** « Amélie Lens » saisi à la main ne
 *    rejoint pas la fiche d'« Amelie Lens », il en crée une seconde ; proposer le nom tel
 *    qu'il est déjà écrit est ce qui rattache le dépôt aux 1 887 fiches existantes.
 *
 * Le découpage en quatre étapes n'est pas décoratif : chaque passage à la suivante valide
 * ses champs avec `parseSubmission()`, **le module qu'utilise la route**, donc on ne
 * découvre pas à la fin qu'une date est dans le passé. La dernière étape ne demande rien,
 * elle relit.
 */

type Genre = { name: string; c1: string; c2: string };
type Step = 0 | 1 | 2 | 3;

/** Les champs contrôlés à chaque étape, pour ne signaler que ce qui est sous les yeux. */
const STEP_FIELDS: string[][] = [
  ["title", "type", "genre", "city", "country", "venue", "date", "endDate", "time", "endTime"],
  ["desc"],
  ["price", "ticketUrl", "posterUrl", "contactEmail"],
  [],
];

const EMPTY = {
  title: "", type: "", genre: "", subgenres: [] as string[], city: "", country: "", venue: "", address: "",
  date: "", endDate: "", time: "", endTime: "", lineup: [] as string[], desc: "", descEn: "",
  price: "", currency: "€", priceNote: "" as "" | "estimated" | "unknown", ticketUrl: "", posterUrl: "",
  posterFile: "", posterData: "", contactEmail: "",
};

export default function OrganizerForm({
  lang, genres, types, currencies,
}: {
  lang: Lang;
  genres: Genre[];
  types: string[];
  currencies: string[];
}) {
  const t = getDict(lang);
  const p = langPrefix(lang);
  const { session, refresh } = usePromoter();
  const account = session?.account ?? null;

  if (session === null) return <div className="org-gate skeleton">{t("pro.loading")}</div>;
  if (session.open === false) return <Gate title={t("pro.closed.title")} text={t("pro.closed")} />;

  if (!account) {
    return (
      <div className="org-gate">
        <span className="eyebrow">{t("org.gate.eyebrow")}</span>
        <h2 className="h-md">{t("org.gate.title")}</h2>
        <p className="lead">{t("org.gate.lead")}</p>
        <PromoterAuth lang={lang} defaultMode="signup" />
      </div>
    );
  }

  if (account.status !== "approved") {
    const key = account.status === "pending" ? "pending" : account.status === "suspended" ? "suspended" : "rejected";
    return (
      <Gate title={t(`pro.status.${key}`)} text={t(`pro.status.${key}.desc`)}>
        <Link href={`${p}/account`} className="btn btn-ghost">
          {t("pro.gotoaccount")}
        </Link>
      </Gate>
    );
  }

  return (
    <Studio
      lang={lang} t={t} p={p} genres={genres} types={types}
      currencies={currencies} promoterName={account.name} defaultEmail={account.email} onSent={refresh}
    />
  );
}

/* ---------------------------------------------------------------------------
   Le formulaire lui-même
--------------------------------------------------------------------------- */

function Studio({
  lang, t, p, genres, types, currencies, promoterName, defaultEmail, onSent,
}: {
  lang: Lang;
  t: (k: string) => string;
  p: string;
  genres: Genre[];
  types: string[];
  currencies: string[];
  promoterName: string;
  defaultEmail: string;
  onSent: () => void;
}) {
  const [step, setStep] = useState<Step>(0);
  const [f, setF] = useState({ ...EMPTY, type: types[0] ?? "", genre: genres[0]?.name ?? "", contactEmail: defaultEmail });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<EventSubmission | null>(null);
  const [notice, setNotice] = useState("");
  const [posterPreview, setPosterPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((s) => ({ ...s, [k]: v }));
    setErrors((e) => (e[k as string] ? { ...e, [k as string]: "" } : e));
  };

  const msg = (code: string) => {
    const k = `org.err.${code}`;
    const v = t(k);
    return v === k ? t("org.err.invalid") : v;
  };
  const err = (k: string) => (errors[k] ? msg(errors[k]) : "");

  const today = new Date().toISOString().slice(0, 10);

  /** Les erreurs du dépôt entier, filtrées à l'étape demandée. C'est la validation du
   *  serveur, appelée telle quelle : une règle ne peut pas diverger entre les deux. */
  const errorsFor = (s: Step): FieldErrors => {
    const res = parseSubmission({ ...f, lang }, today);
    if (!("errors" in res)) return {};
    const keep = STEP_FIELDS[s];
    return Object.fromEntries(Object.entries(res.errors).filter(([k]) => keep.includes(k)));
  };

  const go = (next: Step) => {
    // On ne bloque qu'en avançant : revenir en arrière pour corriger doit rester libre.
    if (next > step) {
      const found = errorsFor(step);
      if (Object.keys(found).length) {
        setErrors(found);
        return;
      }
    }
    setErrors({});
    setNotice("");
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pickPoster = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result ?? "");
      setPosterPreview(data);
      // Au-delà de trois mégaoctets le fournisseur de mail refuse le message entier :
      // on garde alors l'aperçu et le nom, et le propriétaire demandera le fichier.
      setF((s) => ({ ...s, posterFile: file.name, posterData: file.size <= 3 * 1024 * 1024 ? data : "" }));
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (busy) return;
    const res0 = parseSubmission({ ...f, lang }, today);
    if ("errors" in res0) {
      setErrors(res0.errors);
      // On renvoie sur la première étape qui porte une erreur, sinon le message pointe
      // un champ que l'écran courant n'affiche pas.
      const first = ([0, 1, 2] as Step[]).find((s) => STEP_FIELDS[s].some((k) => res0.errors[k]));
      if (first !== undefined) setStep(first);
      setNotice(t("org.err.invalid"));
      return;
    }
    setBusy(true);
    setNotice("");
    const res = await post<{ submission: EventSubmission }>("/api/promoteur/events", { ...f, lang });
    setBusy(false);
    if (isError(res)) {
      setErrors(res.fields ?? {});
      setNotice(msg(res.error));
      return;
    }
    setDone(res.submission);
    onSent();
  };

  if (done) {
    return (
      <Gate title={t("org.sent.title")} text={t("org.sent")}>
        <div className="org-done-actions">
          <Link href={`${p}/account`} className="btn btn-primary">
            {t("org.sent.track")}
          </Link>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setDone(null);
              setF({ ...EMPTY, type: types[0] ?? "", genre: genres[0]?.name ?? "", contactEmail: defaultEmail });
              setPosterPreview("");
              setStep(0);
            }}
          >
            {t("org.sent.another")}
          </button>
        </div>
      </Gate>
    );
  }

  const steps = [t("org.step1"), t("org.step2"), t("org.step3"), t("org.step4")];
  const g = genres.find((x) => x.name === f.genre) ?? genres[0];
  /* Les sous-genres du genre choisi d'abord, puis tout le vocabulaire : une saisie que
     la liste du genre ne connaît pas (« hard » sur du Techno) doit quand même trouver
     « Hard Groove » plutôt que de laisser passer un libellé écrit à la main. */
  const subOptions = [
    ...(SUBGENRES[f.genre] ?? []),
    ...ALL_SUBGENRES.filter((x) => !(SUBGENRES[f.genre] ?? []).includes(x)),
  ];

  return (
    <div className="org-studio">
      <div className="org-main">
        <ol className="wizard" aria-label={t("org.steps")}>
          {steps.map((label, i) => (
            <li key={label} className={`wizard-step ${i === step ? "on" : ""} ${i < step ? "done" : ""}`}>
              <button type="button" onClick={() => go(i as Step)} disabled={i > step}>
                <span className="num">{i < step ? "✓" : i + 1}</span>
                <span className="lbl">{label}</span>
              </button>
            </li>
          ))}
        </ol>

        <form
          className="org-form"
          onSubmit={(e) => {
            e.preventDefault();
            step === 3 ? void submit() : go((step + 1) as Step);
          }}
          noValidate
        >
          {step === 0 && (
            <section className="info-card">
              <h3 className="h-md">{t("org.details")}</h3>
              <div className="form-grid">
                <div className="field full">
                  <label htmlFor="org-title">{t("org.f.title")}</label>
                  <input id="org-title" className={`input ${errors.title ? "bad" : ""}`} value={f.title}
                    onChange={(e) => set("title", e.target.value)} placeholder={t("org.f.title.ph")} />
                  <p className="field-hint">{t("org.f.title.hint")}</p>
                  {err("title") && <p className="field-error">{err("title")}</p>}
                </div>

                <div className="field">
                  <label htmlFor="org-type">{t("org.f.type")}</label>
                  <select id="org-type" className="input" value={f.type} onChange={(e) => set("type", e.target.value)}>
                    {types.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="org-genre">{t("org.f.genre")}</label>
                  <select id="org-genre" className="input" value={f.genre}
                    onChange={(e) => {
                      set("genre", e.target.value);
                      // Les sous-genres restent : ils sont libres, et « Tech House » vaut
                      // pour House comme pour Techno. Seules les propositions changent.
                    }}>
                    {genres.map((x) => (
                      <option key={x.name}>{x.name}</option>
                    ))}
                  </select>
                </div>

                <TagPicker
                  id="org-sub"
                  label={t("org.f.subgenres")}
                  hint={t("org.subgenres.hint")}
                  placeholder={t("org.subgenres.ph")}
                  fullLabel={t("org.subgenres.full")}
                  emptyLabel={t("org.subgenres.empty")}
                  values={f.subgenres}
                  onChange={(v) => set("subgenres", v)}
                  options={subOptions}
                  max={MAX_SUBGENRES}
                  addLabel={t("org.add")}
                />

                <div className="field">
                  <label htmlFor="org-city">{t("org.f.city")}</label>
                  <input id="org-city" className={`input ${errors.city ? "bad" : ""}`} value={f.city}
                    onChange={(e) => set("city", e.target.value)} />
                  {err("city") && <p className="field-error">{err("city")}</p>}
                </div>

                <div className="field">
                  <label htmlFor="org-country">{t("org.f.country")}</label>
                  <input id="org-country" className={`input ${errors.country ? "bad" : ""}`} value={f.country}
                    onChange={(e) => set("country", e.target.value)} />
                  {err("country") && <p className="field-error">{err("country")}</p>}
                </div>

                <div className="field">
                  <label htmlFor="org-venue">{t("org.f.venue")}</label>
                  <input id="org-venue" className={`input ${errors.venue ? "bad" : ""}`} value={f.venue}
                    onChange={(e) => set("venue", e.target.value)} placeholder={t("org.f.venue.ph")} />
                  {err("venue") && <p className="field-error">{err("venue")}</p>}
                </div>

                <div className="field">
                  <label htmlFor="org-address">{t("org.f.address")}</label>
                  <input id="org-address" className="input" value={f.address}
                    onChange={(e) => set("address", e.target.value)} />
                </div>

                <div className="field">
                  <label htmlFor="org-date">{t("org.f.date")}</label>
                  <input id="org-date" type="date" min={today} className={`input ${errors.date ? "bad" : ""}`}
                    value={f.date} onChange={(e) => set("date", e.target.value)} />
                  {err("date") && <p className="field-error">{err("date")}</p>}
                </div>

                <div className="field">
                  <label htmlFor="org-enddate">{t("org.f.enddate")}</label>
                  <input id="org-enddate" type="date" min={f.date || today}
                    className={`input ${errors.endDate ? "bad" : ""}`} value={f.endDate}
                    onChange={(e) => set("endDate", e.target.value)} />
                  <p className="field-hint">{t("org.f.enddate.hint")}</p>
                  {err("endDate") && <p className="field-error">{err("endDate")}</p>}
                </div>

                <div className="field">
                  <label htmlFor="org-time">{t("org.f.time")}</label>
                  <input id="org-time" type="time" className={`input ${errors.time ? "bad" : ""}`} value={f.time}
                    onChange={(e) => set("time", e.target.value)} />
                  {err("time") && <p className="field-error">{err("time")}</p>}
                </div>

                <div className="field">
                  <label htmlFor="org-endtime">{t("org.f.endtime")}</label>
                  <input id="org-endtime" type="time" className="input" value={f.endTime}
                    onChange={(e) => set("endTime", e.target.value)} />
                </div>
              </div>
            </section>
          )}

          {step === 1 && (
            <>
              <section className="info-card">
                <h3 className="h-md">{t("org.lineup")}</h3>
                <TagPicker
                  id="org-artist"
                  label={t("org.addartists")}
                  hint={t("org.lineup.hint")}
                  placeholder={t("org.artist.ph")}
                  emptyLabel={t("org.lineup.empty")}
                  values={f.lineup}
                  onChange={(v) => set("lineup", v)}
                  remote={(q) => searchArtists(q, lang)}
                  max={60}
                  addLabel={t("org.add")}
                />
              </section>

              <section className="info-card">
                <h3 className="h-md">{t("org.desc")}</h3>
                <RichEditor
                  id="org-desc"
                  label={t("org.f.desc")}
                  hint={t("org.f.desc.hint")}
                  value={f.desc}
                  onChange={(v) => set("desc", v)}
                  placeholder={t("org.f.desc.ph")}
                  error={err("desc")}
                  t={{
                    bold: t("rich.bold"), italic: t("rich.italic"), list: t("rich.list"), link: t("rich.link"),
                    preview: t("rich.preview"), write: t("rich.write"), chars: t("rich.chars"),
                  }}
                />
                <details className="org-en">
                  <summary>{t("org.f.descen")}</summary>
                  <p className="field-hint">{t("org.f.descen.hint")}</p>
                  <RichEditor
                    id="org-descen"
                    label={t("org.f.descen.label")}
                    value={f.descEn}
                    onChange={(v) => set("descEn", v)}
                    min={0}
                    t={{
                      bold: t("rich.bold"), italic: t("rich.italic"), list: t("rich.list"), link: t("rich.link"),
                      preview: t("rich.preview"), write: t("rich.write"), chars: t("rich.chars"),
                    }}
                  />
                </details>
              </section>
            </>
          )}

          {step === 2 && (
            <>
              <section className="info-card">
                <h3 className="h-md">{t("org.media")}</h3>
                <div className="field full">
                  <span className="field-label">{t("org.poster")}</span>
                  <label
                    className={`upload ${posterPreview ? "has" : ""}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      pickPoster(e.dataTransfer.files?.[0] ?? null);
                    }}
                  >
                    {posterPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={posterPreview} alt="" className="upload-shot" />
                    ) : (
                      t("org.upload")
                    )}
                    <input ref={fileRef} type="file" accept="image/*" hidden
                      onChange={(e) => pickPoster(e.target.files?.[0] ?? null)} />
                  </label>
                  <p className="field-hint">{t("org.poster.hint")}</p>
                  {f.posterFile && !f.posterData && <p className="field-error">{t("org.poster.big")}</p>}
                </div>

                <div className="field full">
                  <label htmlFor="org-posterurl">{t("org.f.posterurl")}</label>
                  <input id="org-posterurl" className={`input ${errors.posterUrl ? "bad" : ""}`} inputMode="url"
                    placeholder="https://" value={f.posterUrl} onChange={(e) => set("posterUrl", e.target.value)} />
                  {err("posterUrl") && <p className="field-error">{err("posterUrl")}</p>}
                </div>
              </section>

              <section className="info-card">
                <h3 className="h-md">{t("org.tickets")}</h3>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="org-price">{t("org.f.price")}</label>
                    <input id="org-price" className={`input ${errors.price ? "bad" : ""}`} inputMode="decimal"
                      value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="39" />
                    {err("price") && <p className="field-error">{err("price")}</p>}
                  </div>

                  <div className="field">
                    <label htmlFor="org-currency">{t("org.f.currency")}</label>
                    <select id="org-currency" className="input" value={f.currency}
                      onChange={(e) => set("currency", e.target.value)}>
                      {currencies.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="field full">
                    <span className="field-label">{t("org.f.pricenote")}</span>
                    <div className="radiorow">
                      {(["", "estimated", "unknown"] as const).map((v) => (
                        <label key={v || "exact"} className={f.priceNote === v ? "on" : ""}>
                          <input type="radio" name="pricenote" checked={f.priceNote === v}
                            onChange={() => set("priceNote", v)} />
                          {t(`org.pricenote.${v || "exact"}`)}
                        </label>
                      ))}
                    </div>
                    <p className="field-hint">{t("org.f.pricenote.hint")}</p>
                  </div>

                  <div className="field full">
                    <label htmlFor="org-ticket">{t("org.ticketlink")}</label>
                    <input id="org-ticket" className={`input ${errors.ticketUrl ? "bad" : ""}`} inputMode="url"
                      placeholder="https://" value={f.ticketUrl} onChange={(e) => set("ticketUrl", e.target.value)} />
                    <p className="field-hint">{t("org.ticketlink.hint")}</p>
                    {err("ticketUrl") && <p className="field-error">{err("ticketUrl")}</p>}
                  </div>

                  <div className="field full">
                    <label htmlFor="org-contact">{t("org.f.email")}</label>
                    <input id="org-contact" className={`input ${errors.contactEmail ? "bad" : ""}`} type="email"
                      value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
                    {err("contactEmail") && <p className="field-error">{err("contactEmail")}</p>}
                  </div>
                </div>
              </section>
            </>
          )}

          {step === 3 && (
            <section className="info-card org-review">
              <h3 className="h-md">{t("org.review")}</h3>
              <p className="lead">{t("org.review.lead").replace("{name}", promoterName)}</p>
              <dl className="recap">
                <Row k={t("org.f.title")} v={f.title} none={t("org.recap.none")} />
                <Row k={t("org.f.type")} v={`${f.type} · ${f.genre}${f.subgenres.length ? ` (${f.subgenres.join(", ")})` : ""}`} />
                <Row
                  k={t("org.f.date")}
                  v={`${f.date ? fmtDate(f.date, lang) : ""}${f.endDate ? ` → ${fmtDate(f.endDate, lang)}` : ""}${f.time ? ` · ${f.time}` : ""}${f.endTime ? `-${f.endTime}` : ""}`}
                />
                <Row k={t("org.f.venue")} v={[f.venue, f.address, f.city, f.country].filter(Boolean).join(", ")} none={t("org.recap.none")} />
                <Row k={t("org.lineup")} v={f.lineup.join(", ") || t("org.lineup.tba")} />
                <Row
                  k={t("org.f.price")}
                  v={f.price ? `${f.price} ${f.currency}${f.priceNote === "estimated" ? ` (${t("org.pricenote.estimated")})` : ""}` : t("org.pricenote.unknown")}
                />
                <Row k={t("org.ticketlink")} v={f.ticketUrl} none={t("org.recap.none")} />
                <Row k={t("org.poster")} v={f.posterFile || f.posterUrl} none={t("org.recap.none")} />
              </dl>
              <p className="org-note">{t("org.review.note")}</p>
            </section>
          )}

          <div className="org-actions">
            {step > 0 && (
              <button type="button" className="btn btn-ghost" onClick={() => go((step - 1) as Step)}>
                {t("org.prev")}
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? t("alert.sending") : step === 3 ? t("org.submit") : t("org.next")}
            </button>
          </div>

          {notice && (
            <p className="alert-msg" role="status">
              {notice}
            </p>
          )}
        </form>
      </div>

      <aside className="org-preview">
        <div className="org-preview-inner">
          <span className="eyebrow">{t("org.preview")}</span>
          <article className="card org-card">
            <span className="card-genre-bar" style={{ background: `linear-gradient(90deg,${g.c1},${g.c2})` }} />
            <div className="card-media">
              {posterPreview || f.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={posterPreview || f.posterUrl} alt="" className="org-card-shot" />
              ) : (
                <div className="poster" style={{ backgroundImage: `linear-gradient(150deg,${g.c1},${g.c2})` }} />
              )}
              <div className="card-top">
                <span className="tag type">{f.genre}</span>
                {f.type && <span className="tag">{f.type}</span>}
              </div>
              <div className="card-body">
                <div className="card-date">
                  {f.date ? fmtDate(f.date, lang) : "DATE"}
                  {f.time ? ` · ${f.time}` : ""}
                </div>
                <h3 className="card-title">{f.title || t("org.preview.title")}</h3>
                <div className="card-loc">
                  📍 {[f.venue, f.city].filter(Boolean).join(", ") || `${t("org.f.city")}, ${t("org.f.country")}`}
                </div>
              </div>
            </div>
          </article>

          {f.subgenres.length > 0 && (
            <div className="linkfarm org-preview-sub">
              {f.subgenres.map((s) => (
                <span key={s} className="gpill gpill-sub">
                  {s}
                </span>
              ))}
            </div>
          )}
          {f.lineup.length > 0 && (
            <p className="org-preview-line">{t("org.preview.lineup").replace("{n}", String(f.lineup.length))}</p>
          )}
          <p className="org-preview-note">{t("org.preview.note")}</p>
        </div>
      </aside>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Pièces
--------------------------------------------------------------------------- */

/** Une ligne du récapitulatif. Un champ vide s'écrit en toutes lettres plutôt qu'avec un
 *  tiret : sur une relecture avant envoi, « non renseigné » est une information, un signe
 *  de ponctuation isolé se lit comme un défaut d'affichage. */
function Row({ k, v, none = "" }: { k: string; v: string; none?: string }) {
  return (
    <>
      <dt>{k}</dt>
      <dd>{v || none}</dd>
    </>
  );
}

function Gate({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="org-gate">
      <h2 className="h-md">{title}</h2>
      <p className="lead">{text}</p>
      {children}
    </div>
  );
}

/**
 * Les propositions du champ line-up.
 *
 * `kind=artist` : le menu ne doit rendre que des artistes, une ville proposée à cet
 * endroit deviendrait une faute de frappe sur une affiche publiée. L'index vit côté
 * serveur, comme pour la barre du hero, et pour la même raison, le passer au client
 * embarquerait le catalogue.
 */
async function searchArtists(q: string, lang: Lang): Promise<string[]> {
  try {
    const res = await fetch(`/api/search?kind=artist&lang=${lang}&q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: { n: string }[] };
    return (data.items ?? []).map((i) => i.n);
  } catch {
    return [];
  }
}
