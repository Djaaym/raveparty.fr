"use client";
import { useState } from "react";
import type { Lang } from "@/lib/types";
import type { AlertKind } from "@/lib/alerts";
import { getDict } from "@/lib/i18n";
import { readEmail, rememberAlert, rememberEmail, useHasAlert } from "./useAlerts";

type State = "idle" | "sending" | "done" | "invalid" | "unavailable" | "error";

/**
 * The one place a visitor hands over an address. Dropped onto an artist page, a city
 * page, a genre page — anywhere the copy already promised an alert.
 *
 * It never claims success it didn't get: a 501 (no provider wired up yet) renders as
 * "not available", not as a confirmation, because a fake toast is exactly the problem
 * this feature exists to fix.
 */
export default function AlertForm({
  lang,
  kind,
  value,
  label,
  variant = "block",
}: {
  lang: Lang;
  kind: AlertKind;
  /** Slug of the watched thing; empty for the plain newsletter. */
  value: string;
  /** Human name, shown back to the visitor in the confirmation. */
  label: string;
  variant?: "block" | "bare";
}) {
  const t = getDict(lang);
  const already = useHasAlert(kind, value);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  // Hidden from people, irresistible to bots.
  const [company, setCompany] = useState("");

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, kind, value, label, lang, company }),
      });
      if (res.ok) {
        rememberEmail(email);
        rememberAlert({ kind, value, label });
        setState("done");
        return;
      }
      if (res.status === 400) setState("invalid");
      else if (res.status === 501) setState("unavailable");
      else setState("error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className={variant === "bare" ? "alert-form is-done bare" : "alert-form is-done"}>
        <p className="alert-done">✓ {t("alert.done").replace("{label}", label)}</p>
        <p className="alert-fine">{t("alert.donefine")}</p>
      </div>
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
    <form className={variant === "bare" ? "alert-form bare" : "alert-form"} onSubmit={submit}>
      {variant === "block" && (
        <>
          <h3 className="alert-title">{t("alert.title").replace("{label}", label)}</h3>
          <p className="alert-lead">{t("alert.lead")}</p>
        </>
      )}
      <div className="alert-row">
        <label className="sr-only" htmlFor={`alert-${kind}-${value || "all"}`}>
          {t("alert.emaillabel")}
        </label>
        <input
          id={`alert-${kind}-${value || "all"}`}
          className="input"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder={t("cta.ph")}
          value={email}
          onFocus={() => !email && setEmail(readEmail())}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state !== "sending") setState("idle");
          }}
        />
        {/* Off-screen rather than display:none — some bots skip what is hidden outright. */}
        <input
          className="hp"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
        <button className="btn btn-primary" disabled={state === "sending"}>
          {state === "sending" ? t("alert.sending") : t("alert.btn")}
        </button>
      </div>
      {message && (
        <p className="alert-msg" role="status">
          {message}
        </p>
      )}
      {already && state === "idle" && <p className="alert-fine">{t("alert.alreadyset")}</p>}
      <p className="alert-fine">{t("alert.consent")}</p>
    </form>
  );
}
