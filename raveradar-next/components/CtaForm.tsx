"use client";
import { useState } from "react";
import type { Lang } from "@/lib/types";
import { getDict } from "@/lib/i18n";

export default function CtaForm({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const [done, setDone] = useState(false);
  return (
    <form
      className="newsletter"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      {done ? (
        <p className="lead" style={{ margin: "0 auto", color: "var(--cyan)" }}>
          {t("cta.toast")}
        </p>
      ) : (
        <>
          <input className="input" type="email" placeholder={t("cta.ph")} required />
          <button className="btn btn-primary">{t("cta.btn")}</button>
        </>
      )}
    </form>
  );
}
