"use client";
import { useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/types";
import type { EventSubmission, FieldErrors, PublicAccount } from "@/lib/accounts";
import { PROMOTER_KINDS } from "@/lib/accounts";
import { getDict, langPrefix } from "@/lib/i18n";
import { fmtDate } from "@/lib/format";
import { isError, post, usePromoter } from "./usePromoter";

/**
 * Ce qu'un promoteur connecté voit de son compte : ses dépôts, et son profil.
 *
 * Les deux existaient déjà à l'écran, en dur : `/account` affichait un nom, une ville et
 * une adresse codés dans le composant, et quatre alertes écrites à la main. Ici tout
 * vient de la session, et « Enregistrer » enregistre.
 */

/* ---------------------------------------------------------------------------
   Les dépôts
--------------------------------------------------------------------------- */

export function PromoterSubmissions({
  lang, submissions, status,
}: {
  lang: Lang;
  submissions: EventSubmission[];
  status: PublicAccount["status"];
}) {
  const t = getDict(lang);
  const p = langPrefix(lang);

  if (status !== "approved") {
    const key = status === "pending" ? "pending" : status === "suspended" ? "suspended" : "rejected";
    return (
      <div className="info-card">
        <h3 className="h-md">{t(`pro.status.${key}`)}</h3>
        <p style={{ color: "var(--grey)" }}>{t(`pro.status.${key}.desc`)}</p>
      </div>
    );
  }

  return (
    <>
      <div className="pro-subhead">
        <p className="lead">{t("pro.sub.lead")}</p>
        <Link href={`${p}/organizer`} className="btn btn-primary btn-sm">
          {t("pro.sub.new")}
        </Link>
      </div>

      {submissions.length === 0 ? (
        <p style={{ color: "var(--grey)" }}>{t("pro.sub.empty")}</p>
      ) : (
        <ul className="sublist">
          {submissions.map((s) => (
            <li key={s.id} className="subrow">
              <span className={`subrow-state s-${s.status}`}>{t(`pro.sub.status.${s.status}`)}</span>
              <div className="subrow-main">
                <b>{s.title}</b>
                <span className="subrow-meta">
                  {fmtDate(s.date, lang)} · {s.venue}, {s.city} · {s.genre}
                  {s.subgenres.length ? ` (${s.subgenres.join(", ")})` : ""}
                </span>
              </div>
              <span className="subrow-at">{t("pro.sub.sent").replace("{date}", fmtDate(s.createdAt.slice(0, 10), lang))}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="pro-note">{t("pro.sub.note")}</p>
    </>
  );
}

/* ---------------------------------------------------------------------------
   Le profil
--------------------------------------------------------------------------- */

export function PromoterProfileForm({ lang, account }: { lang: Lang; account: PublicAccount }) {
  const t = getDict(lang);
  const { adopt } = usePromoter();
  const [f, setF] = useState({
    name: account.name, kind: account.kind, contact: account.contact, phone: account.phone,
    city: account.city, country: account.country, website: account.website, instagram: account.instagram,
    soundcloud: account.soundcloud, legalId: account.legalId, about: account.about,
    currentPassword: "", newPassword: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  const msg = (code: string) => {
    const k = `pro.err.${code}`;
    const v = t(k);
    return v === k ? t("pro.err.required") : v;
  };
  const err = (k: string) => (errors[k] ? msg(errors[k]) : "");

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy) return;
    setBusy(true);
    setNotice("");
    setErrors({});
    const res = await post<{ account: PublicAccount }>("/api/promoteur/me", { ...f, lang }, "PATCH");
    setBusy(false);
    if (isError(res)) {
      setErrors(res.fields ?? {});
      setNotice(msg(res.error));
      return;
    }
    adopt(res.account);
    // Les deux champs de mot de passe se vident : les laisser remplis ferait renvoyer
    // le même changement au prochain enregistrement, qui échouerait sur l'ancien.
    setF((s) => ({ ...s, currentPassword: "", newPassword: "" }));
    setNotice(t("pro.profile.saved"));
  };

  return (
    <form className="info-card pro-profile" onSubmit={save} noValidate>
      <h3 className="h-md">{t("pro.profile.title")}</h3>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="pp-name">{t("pro.f.name")}</label>
          <input id="pp-name" className={`input ${errors.name ? "bad" : ""}`} value={f.name}
            onChange={(e) => set("name", e.target.value)} />
          {err("name") && <p className="field-error">{err("name")}</p>}
        </div>
        <div className="field">
          <label htmlFor="pp-kind">{t("pro.f.kind")}</label>
          <select id="pp-kind" className="input" value={f.kind} onChange={(e) => set("kind", e.target.value)}>
            {PROMOTER_KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`pro.kind.${k}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pp-contact">{t("pro.f.contact")}</label>
          <input id="pp-contact" className={`input ${errors.contact ? "bad" : ""}`} value={f.contact}
            onChange={(e) => set("contact", e.target.value)} />
          {err("contact") && <p className="field-error">{err("contact")}</p>}
        </div>
        <div className="field">
          <label htmlFor="pp-phone">{t("pro.f.phone")}</label>
          <input id="pp-phone" className="input" type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pp-city">{t("pro.f.city")}</label>
          <input id="pp-city" className={`input ${errors.city ? "bad" : ""}`} value={f.city}
            onChange={(e) => set("city", e.target.value)} />
          {err("city") && <p className="field-error">{err("city")}</p>}
        </div>
        <div className="field">
          <label htmlFor="pp-country">{t("pro.f.country")}</label>
          <input id="pp-country" className={`input ${errors.country ? "bad" : ""}`} value={f.country}
            onChange={(e) => set("country", e.target.value)} />
          {err("country") && <p className="field-error">{err("country")}</p>}
        </div>
        <div className="field">
          <label htmlFor="pp-site">{t("pro.f.website")}</label>
          <input id="pp-site" className={`input ${errors.website ? "bad" : ""}`} inputMode="url" value={f.website}
            onChange={(e) => set("website", e.target.value)} />
          {err("website") && <p className="field-error">{err("website")}</p>}
        </div>
        <div className="field">
          <label htmlFor="pp-legal">{t("pro.f.legal")}</label>
          <input id="pp-legal" className="input" value={f.legalId} onChange={(e) => set("legalId", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pp-ig">{t("pro.f.instagram")}</label>
          <input id="pp-ig" className="input" value={f.instagram} onChange={(e) => set("instagram", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pp-sc">{t("pro.f.soundcloud")}</label>
          <input id="pp-sc" className="input" value={f.soundcloud} onChange={(e) => set("soundcloud", e.target.value)} />
        </div>
        <div className="field full">
          <label htmlFor="pp-about">{t("pro.f.about")}</label>
          <textarea id="pp-about" className={`input ${errors.about ? "bad" : ""}`} value={f.about}
            onChange={(e) => set("about", e.target.value)} />
          {err("about") && <p className="field-error">{err("about")}</p>}
        </div>

        <div className="field full proauth-sep">
          <span className="eyebrow">{t("pro.pw.change")}</span>
          <p className="field-hint">{t("pro.pw.change.hint")}</p>
        </div>
        <div className="field">
          <label htmlFor="pp-pw0">{t("pro.pw.current")}</label>
          <input id="pp-pw0" className={`input ${errors.currentPassword ? "bad" : ""}`} type="password"
            autoComplete="current-password" value={f.currentPassword}
            onChange={(e) => set("currentPassword", e.target.value)} />
          {err("currentPassword") && <p className="field-error">{err("currentPassword")}</p>}
        </div>
        <div className="field">
          <label htmlFor="pp-pw1">{t("pro.pw.new")}</label>
          <input id="pp-pw1" className={`input ${errors.newPassword ? "bad" : ""}`} type="password"
            autoComplete="new-password" value={f.newPassword} onChange={(e) => set("newPassword", e.target.value)} />
          {err("newPassword") && <p className="field-error">{err("newPassword")}</p>}
        </div>
      </div>

      <div className="field full">
        <span className="field-label">{t("pro.f.email")}</span>
        <p className="pro-static">{account.email}</p>
        <p className="field-hint">{t("pro.f.email.locked")}</p>
      </div>

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? t("alert.sending") : t("pro.profile.save")}
      </button>
      {notice && (
        <p className="alert-msg" role="status">
          {notice}
        </p>
      )}
    </form>
  );
}
