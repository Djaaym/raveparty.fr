"use client";
import { useState } from "react";
import type { Lang } from "@/lib/types";
import type { FieldErrors, PublicAccount } from "@/lib/accounts";
import { PROMOTER_KINDS, passwordIssue } from "@/lib/accounts";
import { getDict } from "@/lib/i18n";
import { isError, post, usePromoter } from "./usePromoter";

/**
 * Se connecter, ou créer un compte promoteur.
 *
 * Le site affichait jusqu'ici un compte en dur : « Connexion » ouvrait la page d'un
 * utilisateur qui n'existait pas, avec quatre alertes écrites à la main. Ce composant le
 * remplace par une vraie session, et le mot de passe est validé **par le même module que
 * la route** (`lib/accounts.ts`), pour que le message affiché sous le champ soit exactement
 * celui qui décidera de l'enregistrement, plutôt qu'une approximation qui laisse envoyer
 * un formulaire que le serveur refusera.
 *
 * L'inscription est longue, et c'est délibéré : ce que le propriétaire lit pour décider,
 * c'est ce formulaire. Un compte demandé avec trois champs ne se valide pas, il se
 * relance par mail, ce qui coûte deux jours à tout le monde.
 */

type Mode = "signin" | "signup";

const KIND_KEYS = PROMOTER_KINDS;

export default function PromoterAuth({ lang, defaultMode = "signin" }: { lang: Lang; defaultMode?: Mode }) {
  const t = getDict(lang);
  const { session, adopt } = usePromoter();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState("");

  const [f, setF] = useState({
    email: "", password: "", name: "", kind: "collectif", contact: "", phone: "",
    city: "", country: "", website: "", instagram: "", soundcloud: "", legalId: "", about: "",
    terms: false, company: "",
  });
  const set = (k: keyof typeof f, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  const closed = session?.open === false;
  /* `getDict` rend la clé elle-même quand elle manque, donc un `||` ne retomberait
     jamais : on compare au nom de la clé pour distinguer « traduit » de « absent ». */
  const msg = (code: string) => {
    const k = `pro.err.${code}`;
    const v = t(k);
    return v === k ? t("pro.err.required") : v;
  };
  const err = (k: string) => (errors[k] ? msg(errors[k]) : "");

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (busy || closed) return;
    setNotice("");

    if (mode === "signup") {
      // Contrôle local d'abord, avec les règles du serveur : un refus qui arrive sans
      // aller-retour se corrige tout de suite, et le message est le même dans les deux cas.
      const local: FieldErrors = {};
      const issue = passwordIssue(f.password, f.email, f.name);
      if (issue) local.password = issue;
      if (!f.terms) local.terms = "required";
      if (Object.keys(local).length) {
        setErrors(local);
        return;
      }
    }

    setBusy(true);
    setErrors({});
    const res = await post<{ account: PublicAccount }>(
      mode === "signin" ? "/api/promoteur/login" : "/api/promoteur/signup",
      mode === "signin" ? { email: f.email, password: f.password } : { ...f, lang },
    );
    setBusy(false);

    if (isError(res)) {
      setErrors(res.fields ?? {});
      setNotice(msg(res.error));
      return;
    }
    adopt(res.account);
    // Le formulaire d'inscription fait trois écrans : sans ça, on reste devant le vide
    // qu'il laisse en disparaissant, au lieu de son propre en-tête de compte.
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="proauth">
      <div className="proauth-switch" role="tablist">
        {(["signin", "signup"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            className={mode === m ? "on" : ""}
            onClick={() => {
              setMode(m);
              setErrors({});
              setNotice("");
            }}
          >
            {t(m === "signin" ? "pro.signin.title" : "pro.signup.title")}
          </button>
        ))}
      </div>

      <form className="proauth-form" onSubmit={submit} noValidate>
        <p className="lead proauth-lead">{t(mode === "signin" ? "pro.signin.lead" : "pro.signup.lead")}</p>

        {closed && <p className="proauth-closed">{t("pro.closed")}</p>}

        <div className="form-grid">
          <div className={`field ${mode === "signin" ? "full" : ""}`}>
            <label htmlFor="pro-email">{t("pro.f.email")}</label>
            <input
              id="pro-email" className={`input ${errors.email ? "bad" : ""}`} type="email" required
              autoComplete="email" inputMode="email" value={f.email} onChange={(e) => set("email", e.target.value)}
            />
            {err("email") && <p className="field-error">{err("email")}</p>}
          </div>

          <div className={`field ${mode === "signin" ? "full" : ""}`}>
            <label htmlFor="pro-pw">{t("pro.f.password")}</label>
            <input
              id="pro-pw" className={`input ${errors.password ? "bad" : ""}`} type="password" required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={f.password} onChange={(e) => set("password", e.target.value)}
            />
            {mode === "signup" && !errors.password && <p className="field-hint">{t("pro.pw.hint")}</p>}
            {err("password") && <p className="field-error">{err("password")}</p>}
          </div>

          {mode === "signup" && (
            <>
              <div className="field full proauth-sep">
                <span className="eyebrow">{t("pro.sec.structure")}</span>
              </div>

              <div className="field">
                <label htmlFor="pro-name">{t("pro.f.name")}</label>
                <input id="pro-name" className={`input ${errors.name ? "bad" : ""}`} required
                  value={f.name} onChange={(e) => set("name", e.target.value)} placeholder={t("pro.f.name.ph")} />
                {err("name") && <p className="field-error">{err("name")}</p>}
              </div>

              <div className="field">
                <label htmlFor="pro-kind">{t("pro.f.kind")}</label>
                <select id="pro-kind" className="input" value={f.kind} onChange={(e) => set("kind", e.target.value)}>
                  {KIND_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {t(`pro.kind.${k}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="pro-contact">{t("pro.f.contact")}</label>
                <input id="pro-contact" className={`input ${errors.contact ? "bad" : ""}`} required
                  autoComplete="name" value={f.contact} onChange={(e) => set("contact", e.target.value)} />
                {err("contact") && <p className="field-error">{err("contact")}</p>}
              </div>

              <div className="field">
                <label htmlFor="pro-phone">{t("pro.f.phone")}</label>
                <input id="pro-phone" className="input" type="tel" autoComplete="tel"
                  value={f.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="pro-city">{t("pro.f.city")}</label>
                <input id="pro-city" className={`input ${errors.city ? "bad" : ""}`} required
                  value={f.city} onChange={(e) => set("city", e.target.value)} />
                {err("city") && <p className="field-error">{err("city")}</p>}
              </div>

              <div className="field">
                <label htmlFor="pro-country">{t("pro.f.country")}</label>
                <input id="pro-country" className={`input ${errors.country ? "bad" : ""}`} required
                  value={f.country} onChange={(e) => set("country", e.target.value)} />
                {err("country") && <p className="field-error">{err("country")}</p>}
              </div>

              <div className="field full proauth-sep">
                <span className="eyebrow">{t("pro.sec.proof")}</span>
                <p className="field-hint">{t("pro.sec.proof.hint")}</p>
              </div>

              <div className="field">
                <label htmlFor="pro-site">{t("pro.f.website")}</label>
                <input id="pro-site" className={`input ${errors.website ? "bad" : ""}`} inputMode="url"
                  placeholder="https://" value={f.website} onChange={(e) => set("website", e.target.value)} />
                {err("website") && <p className="field-error">{err("website")}</p>}
              </div>

              <div className="field">
                <label htmlFor="pro-ig">{t("pro.f.instagram")}</label>
                <input id="pro-ig" className="input" placeholder="@" value={f.instagram}
                  onChange={(e) => set("instagram", e.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="pro-sc">{t("pro.f.soundcloud")}</label>
                <input id="pro-sc" className="input" placeholder="@" value={f.soundcloud}
                  onChange={(e) => set("soundcloud", e.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="pro-legal">{t("pro.f.legal")}</label>
                <input id="pro-legal" className="input" value={f.legalId}
                  onChange={(e) => set("legalId", e.target.value)} />
              </div>

              <div className="field full">
                <label htmlFor="pro-about">{t("pro.f.about")}</label>
                <p className="field-hint">{t("pro.f.about.hint")}</p>
                <textarea id="pro-about" className={`input ${errors.about ? "bad" : ""}`} required
                  value={f.about} onChange={(e) => set("about", e.target.value)} />
                {/* Le compteur ne passe en alerte qu'une fois quelque chose écrit : un
                    champ jamais touché n'a pas d'erreur, il est simplement vide. */}
                <p className={`field-hint ${f.about.trim().length && f.about.trim().length < 80 ? "low" : ""}`}>
                  {t("pro.f.about.count").replace("{n}", String(f.about.trim().length))}
                </p>
                {err("about") && <p className="field-error">{err("about")}</p>}
              </div>

              <div className="field full">
                <label className="checkline">
                  <input type="checkbox" checked={f.terms} onChange={(e) => set("terms", e.target.checked)} />
                  <span>{t("pro.terms")}</span>
                </label>
                {err("terms") && <p className="field-error">{err("terms")}</p>}
              </div>
            </>
          )}
        </div>

        <input className="hp" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"
          value={f.company} onChange={(e) => set("company", e.target.value)} />

        <button type="submit" className="btn btn-primary btn-block" disabled={busy || closed}>
          {busy ? t("alert.sending") : t(mode === "signin" ? "pro.submit.signin" : "pro.submit.signup")}
        </button>

        {notice && (
          <p className="alert-msg" role="status">
            {notice}
          </p>
        )}

        <p className="proauth-foot">
          {t(mode === "signin" ? "pro.havenot" : "pro.have")}{" "}
          <button type="button" className="linkish" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {t(mode === "signin" ? "pro.signup.title" : "pro.signin.title")}
          </button>
        </p>
      </form>
    </div>
  );
}
