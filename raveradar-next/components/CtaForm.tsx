"use client";
import { useState } from "react";
import type { Lang } from "@/lib/types";
import { getDict } from "@/lib/i18n";
import { rememberAlert, rememberEmail } from "./useAlerts";

type State = "idle" | "sending" | "done" | "invalid" | "unavailable" | "error";

/** The homepage newsletter. Same endpoint as a page alert, with no watched subject. */
export default function CtaForm({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [state, setState] = useState<State>("idle");

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, kind: "newsletter", value: "", label: "RaveRadar", lang, company }),
      });
      if (res.ok) {
        rememberEmail(email);
        rememberAlert({ kind: "newsletter", value: "", label: t("alert.kind.newsletter") });
        setState("done");
        return;
      }
      setState(res.status === 400 ? "invalid" : res.status === 501 ? "unavailable" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <p className="lead" style={{ margin: "28px auto 0", color: "var(--cyan)", textAlign: "center" }}>
        {t("cta.toast")}
      </p>
    );
  }

  const message =
    state === "invalid"
      ? t("alert.err.email")
      : state === "unavailable"
        ? t("alert.err.soon")
        : state === "error"
          ? t("alert.err.retry")
          : "";

  return (
    <>
      <form className="newsletter" onSubmit={submit}>
        <label className="sr-only" htmlFor="cta-email">
          {t("alert.emaillabel")}
        </label>
        <input
          id="cta-email"
          className="input"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder={t("cta.ph")}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state !== "sending") setState("idle");
          }}
        />
        <input
          className="hp"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <button className="btn btn-primary" disabled={state === "sending"}>
          {state === "sending" ? t("alert.sending") : t("cta.btn")}
        </button>
      </form>
      {message && (
        <p className="alert-msg" role="status" style={{ textAlign: "center" }}>
          {message}
        </p>
      )}
    </>
  );
}
